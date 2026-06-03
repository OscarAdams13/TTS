import { GoogleGenAI, Modality } from "@google/genai";
import type { Speaker, Dialog, GlobalSettings } from '../types';
import { decode, encode } from '../utils/audioUtils';
import { synthesizeWithClonedVoice } from './customVoiceService';

const API_KEY = process.env.API_KEY;

/**
 * Constructs a robust prompt for the 2-speaker TTS model.
 * This new structure provides speaker personalities as upfront context, which is the
 * correct and most reliable method for the Gemini TTS model. This prevents the model
 * from reading personality descriptions aloud.
 * The 'speakers' array passed to this function MUST be pre-sorted alphabetically by name.
 */
function constructMultiSpeakerPrompt(speakers: Speaker[], dialogs: Dialog[]): string {
    // This function assumes `speakers` is an array of exactly two speakers, pre-sorted.
    const speakerDescriptions = speakers.map(s => {
        const name = s.name.trim();
        const personality = s.personality?.trim();
        if (personality) {
            // Format: "SpeakerName (personality: their personality)"
            return `${name} (personality: ${personality})`;
        }
        return name;
    });

    const introLine = `TTS the following conversation between ${speakerDescriptions.join(' and ')}:`;

    const formatTextWithStyle = (dialog: Dialog): string => {
        const text = dialog.text.trim();
        const style = dialog.style?.trim();
        
        // Only include short, parenthetical style directions in the script.
        if (style) {
            return `(${style}) ${text}`;
        }
        return text;
    };
    
    const script = dialogs
        .map(dialog => {
            const speaker = speakers.find(s => s.id === dialog.speakerId);
            // Skip empty lines or lines with no valid speaker
            if (!dialog.text.trim() || !speaker) return null;
            
            const line = formatTextWithStyle(dialog);
            return `${speaker.name.trim()}: ${line}`;
        })
        .filter(Boolean)
        .join('\n');

    const finalPrompt = `${introLine}\n${script}`;
    
    return finalPrompt;
}


/**
 * Generates audio for a single line of dialogue, combining speaker personality and line-specific style.
 * This uses a more robust prompt structure to avoid the model speaking the instructions.
 */
async function generateSingleLineSpeech(ai: GoogleGenAI, dialog: Dialog, speaker: Speaker, settings: GlobalSettings): Promise<string> {
    const text = dialog.text.trim();
    if (!text) return "";

    const personality = speaker.personality?.trim();
    const style = dialog.style?.trim();

    if (speaker.voice === 'chirp3-custom') {
        if (!speaker.customVoiceKey) {
            throw new Error(`Speaker "${speaker.name}" is using Custom Voice but hasn't been configured yet.`);
        }
        let line = text;
        if (style) line = `(${style}) ${text}`; // Custom voice might respect some formatting like text-to-speech cues
        return await synthesizeWithClonedVoice(settings.gcpToken, settings.gcpProjectId, speaker.customVoiceKey, line);
    }

    let prompt: string;

    if (personality) {
        // When a personality is defined, use a more structured "mini-script" prompt
        // to provide clear context to the model, similar to the multi-speaker format.
        const speakerName = speaker.name;
        let line = text;
        if (style) {
            line = `(${style}) ${text}`;
        }
        prompt = `TTS a line from ${speakerName} (personality: ${personality}):\n${speakerName}: ${line}`;
    } else {
        // For speakers without a defined personality, use a simpler, direct instruction.
        if (style) {
            // This format matches documented examples for simple directions.
            prompt = `Say ${style}: ${text}`;
        } else {
            prompt = text;
        }
    }
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speaker.voice },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || "";
}

/**
 * Generates a short preview audio for a specific voice.
 */
export const generateVoicePreview = async (voiceId: string): Promise<string> => {
    if (!API_KEY) {
        throw new Error("API Key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const prompt = "Hello, this is my voice.";

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceId },
                },
            },
        },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Failed to generate voice preview.");
    return base64Audio;
}

/**
 * Creates a silent PCM buffer.
 * Gemini TTS output: 24kHz, 1 channel, 16-bit (2 bytes per sample).
 * Byte rate = 24000 * 2 = 48000 bytes/second.
 */
function createSilence(durationMs: number): Uint8Array {
    if (durationMs <= 0) return new Uint8Array(0);
    const numBytes = Math.floor((durationMs / 1000) * 48000);
    return new Uint8Array(numBytes); // Initialized to 0 by default (silence)
}

export const generateSpeech = async (
    speakers: Speaker[], 
    dialogs: Dialog[], 
    settings: GlobalSettings
): Promise<string> => {
    if (!API_KEY) {
        throw new Error("API Key is not configured. Cannot generate speech.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const nonEmptyDialogs = dialogs.filter(d => d.text.trim().length > 0);
    if (nonEmptyDialogs.length === 0) {
        throw new Error("Script is empty. Please write some dialogue to generate speech.");
    }

    const uniqueSpeakerIdsInOrder = [...new Set(nonEmptyDialogs.map(d => d.speakerId))];
    const speakersInScript = uniqueSpeakerIdsInOrder.map(id => {
        const speaker = speakers.find(s => s.id === id);
        if (!speaker) throw new Error(`Data inconsistency: Speaker with ID "${id}" not found.`);
        return speaker;
    });
    
    // Determine generation strategy
    const hasCustomVoice = speakersInScript.some(s => s.voice === 'chirp3-custom');
    const canUseMultiSpeaker = speakersInScript.length === 2 && !hasCustomVoice;
    const shouldUseMultiSpeaker = canUseMultiSpeaker && !settings.forceLineByLine;

    if (shouldUseMultiSpeaker) {
        // Use optimized 2-speaker model
        const sortedSpeakers = [...speakersInScript].sort((a, b) => a.name.trim().localeCompare(b.name.trim()));
        
        const prompt = constructMultiSpeakerPrompt(sortedSpeakers, nonEmptyDialogs);
        
        const speakerConfigs = sortedSpeakers.map(speaker => ({
            speaker: speaker.name.trim(),
            voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker.voice } }
        }));
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    multiSpeakerVoiceConfig: { speakerVoiceConfigs: speakerConfigs }
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("Failed to generate audio (2-speaker).");
        return base64Audio;

    } else {
        // Use line-by-line generation (for 1, 3+ speakers, or forced mode)
        // This mode supports inserting silence gaps between lines.
        const audioPromises = nonEmptyDialogs.map(dialog => {
            const speaker = speakers.find(s => s.id === dialog.speakerId)!;
            return generateSingleLineSpeech(ai, dialog, speaker, settings);
        });

        const base64AudioChunks = await Promise.all(audioPromises);
        const pcmChunks = base64AudioChunks.filter(Boolean).map(b64 => decode(b64));
        
        if (pcmChunks.length === 0) {
            throw new Error("No audio was generated. The script might be empty or contain only silent lines.");
        }

        // Calculate total size including gaps
        const gapBuffer = createSilence(settings.lineGap);
        const totalGapLength = (pcmChunks.length - 1) * gapBuffer.length;
        const totalContentLength = pcmChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const totalLength = totalContentLength + (totalGapLength > 0 ? totalGapLength : 0);

        const combinedPcm = new Uint8Array(totalLength);
        let offset = 0;
        
        for (let i = 0; i < pcmChunks.length; i++) {
            const chunk = pcmChunks[i];
            combinedPcm.set(chunk, offset);
            offset += chunk.length;
            
            // Add gap if not the last chunk and gap > 0
            if (i < pcmChunks.length - 1 && gapBuffer.length > 0) {
                combinedPcm.set(gapBuffer, offset);
                offset += gapBuffer.length;
            }
        }
        
        return encode(combinedPcm);
    }
};
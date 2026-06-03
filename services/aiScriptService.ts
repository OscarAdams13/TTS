
import { GoogleGenAI, Type } from "@google/genai";
import type { Speaker, Dialog } from '../types';
import { VOICES, SPEAKER_COLORS } from '../constants';

const API_KEY = process.env.API_KEY;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        speakers: {
            type: Type.ARRAY,
            description: "An array of speaker objects identified or created for the script.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier for the speaker, e.g., 'speaker-1'." },
                    name: { type: Type.STRING, description: "The name of the speaker." },
                    voice: { type: Type.STRING, description: "The assigned voice for the speaker. Must be one of the provided voice names." },
                    color: { type: Type.STRING, description: "A hex color code for the speaker from the provided list." },
                    personality: { type: Type.STRING, description: "A brief, one-sentence description of the speaker's personality or tone." },
                },
                required: ['id', 'name', 'voice', 'color', 'personality'],
            },
        },
        dialogs: {
            type: Type.ARRAY,
            description: "An array of dialog lines, in chronological order.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier for the dialog line, e.g., 'dialog-1'." },
                    speakerId: { type: Type.STRING, description: "The ID of the speaker who is speaking this line. Must match an ID from the 'speakers' array." },
                    text: { type: Type.STRING, description: "The text of the dialog line." },
                    style: { type: Type.STRING, description: "A one or two-word style instruction (e.g., 'shouting', 'whispering', 'casually'). Leave as empty string if none." },
                },
                required: ['id', 'speakerId', 'text', 'style'],
            },
        },
    },
    required: ['speakers', 'dialogs'],
};


export const generateScriptFromText = async (scriptText: string, instructions: string, useSteering: boolean = false): Promise<{ speakers: Speaker[], dialogs: Dialog[] }> => {
    if (!API_KEY) {
        throw new Error("API Key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const voiceList = VOICES.map(v => v.id).join(', ');
    const colorList = SPEAKER_COLORS.join(', ');

    const steeringInstruction = useSteering ? `
- **Typographical & Phonetic Steering**: You MUST manipulate the text string directly for emotional delivery. Use formatting like:
  - Hesitation: "I... I-I don't know." (Triggers natural vocal stutters/stumbles and gasps).
  - Elongation: "Wait, heyyyyyy!" (Forces the model to vocalize fry and drag the word).
  - Intensity: "I SAID STOP." (Forces volume adjustments).
  Write and change the text according to the emotion of the scene.` : "";

    const systemInstruction = `You are a world-class creative scriptwriter and multimedia assistant. 

YOUR CORE TASK:
Analyze the input. 
- If the input is an existing script/chat, clean it up and format it.
- If the input is a SCENARIO, STORY PROMPT, or DESCRIPTION, you must CREATE a high-quality, engaging script from scratch based on that prompt.
- Aim for roughly 10-20 lines of dialogue for new scripts.
- Invent character names, distinct personalities, and dynamic dialogue if they are not provided.
- Ensure the dialogue sounds natural, includes appropriate pauses or reactions (as 'style' tags), and fits the described atmosphere.

CONSTRAINTS:
- Use ONLY the JSON format provided in the schema.
- **Language Preservation**: Keep dialogue in its original language (e.g., Hebrew stays Hebrew) unless asked to translate.
- **Voice Assignment**: Match voices from the provided list to the personalities you invent.
- **Consecutive Dialogue**: If a character speaks twice in a row, merge it into one block unless a 'style' change is needed.
- **Style Instructions**: Use the 'style' field for delivery directions (e.g., "amazed", "dryly", "annoyed").
- **Safety**: Do not censor social or creative scenarios (like friends hanging out in a casual setting) unless they violate core safety policies. Creative writing for fiction is encouraged.${steeringInstruction}`;

    const prompt = `Please process the following input into a professional TTS script.

    **Instructions/Context:**
    ${instructions || "No specific instructions provided. Make it cinematic and engaging."}

    **Input Text (Script or Scene Description):**
    \`\`\`
    ${scriptText}
    \`\`\`

    **Available Voices (MUST use IDs from this list):**
    ${voiceList}

    **Available Speaker Colors:**
    ${colorList}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            maxOutputTokens: 40000,
        },
    });

    try {
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText);
        if (Array.isArray(parsedResult.speakers) && Array.isArray(parsedResult.dialogs)) {
            return parsedResult;
        } else {
            throw new Error("Invalid structure returned.");
        }
    } catch (e) {
        console.error("Failed to parse JSON response:", response.text);
        throw new Error("The AI failed to generate a valid script. Try describing the scene with more detail or shortening the prompt.");
    }
};

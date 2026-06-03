import React, { useState } from 'react';
import type { Speaker } from '../types';
import { VOICES } from '../constants';
import { IconAdd, IconTrash, IconVoice, IconUser, IconSpinner, IconSettings } from './icons';
import { generateVoicePreview } from '../services/ttsService';
import { createAudioUrl } from '../utils/audioUtils';

interface SpeakerEditorProps {
    speaker: Speaker;
    onSpeakerChange: (speaker: Speaker) => void;
    onDelete: () => void;
    canDelete: boolean;
    onConfigureCustomVoice: (speakerId: string) => void;
}

const SpeakerEditor: React.FC<SpeakerEditorProps> = ({ speaker, onSpeakerChange, onDelete, canDelete, onConfigureCustomVoice }) => {
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const handleVoiceChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newVoiceId = event.target.value;
        onSpeakerChange({ ...speaker, voice: newVoiceId });

        if (newVoiceId === 'chirp3-custom') {
            return; // Preview is not possible for unconfigured custom voice
        }

        setIsPreviewLoading(true);
        try {
            const base64Audio = await generateVoicePreview(newVoiceId);
            const url = createAudioUrl(base64Audio);
            const audio = new Audio(url);
            audio.play();
            audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true });
        } catch (error) {
            console.error("Failed to generate voice preview:", error);
        } finally {
            setIsPreviewLoading(false);
        }
    };


    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 space-y-4">
            <div className="flex items-center justify-between">
                <input
                    type="text"
                    value={speaker.name}
                    onChange={(e) => onSpeakerChange({ ...speaker, name: e.target.value })}
                    className="w-full bg-transparent text-lg font-semibold focus:ring-0 border-none p-0"
                    style={{ color: speaker.color }}
                    aria-label="Speaker Name"
                />
                {canDelete && (
                    <button onClick={onDelete} className="text-slate-500 hover:text-red-500" aria-label="Delete Speaker">
                        <IconTrash size={18} />
                    </button>
                )}
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label htmlFor={`voice-${speaker.id}`} className="text-sm font-medium text-slate-400 flex items-center gap-2">
                        <IconVoice />
                        Voice
                    </label>
                    {isPreviewLoading && <IconSpinner size={16} className="text-cyan-400" />}
                </div>
                <div className="flex gap-2">
                    <select
                        id={`voice-${speaker.id}`}
                        value={speaker.voice}
                        onChange={handleVoiceChange}
                        disabled={isPreviewLoading}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50"
                    >
                        {VOICES.map(voice => (
                            <option key={voice.id} value={voice.id} className="bg-slate-800" title={voice.description}>
                                {voice.name} {voice.gender === 'male' ? '(M)' : voice.gender === 'female' ? '(F)' : ''}
                            </option>
                        ))}
                    </select>
                    {speaker.voice === 'chirp3-custom' && (
                        <button
                            onClick={() => onConfigureCustomVoice(speaker.id)}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-md transition-colors"
                            title="Configure Custom Voice"
                        >
                            <IconSettings size={20} />
                        </button>
                    )}
                </div>
            </div>
             <div>
                <label htmlFor={`personality-${speaker.id}`} className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <IconUser />
                    Personality
                </label>
                <input
                    id={`personality-${speaker.id}`}
                    type="text"
                    value={speaker.personality || ''}
                    onChange={(e) => onSpeakerChange({ ...speaker, personality: e.target.value })}
                    placeholder="e.g., cheerful, gruff, wise"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    aria-label="Speaker Personality"
                />
            </div>
        </div>
    )
}


interface SpeakerPanelProps {
  speakers: Speaker[];
  onSpeakerChange: (speaker: Speaker) => void;
  onAddSpeaker: () => void;
  onDeleteSpeaker: (speakerId: string) => void;
  onConfigureCustomVoice: (speakerId: string) => void;
}

export const SpeakerPanel: React.FC<SpeakerPanelProps> = ({ 
    speakers, 
    onSpeakerChange, 
    onAddSpeaker,
    onDeleteSpeaker,
    onConfigureCustomVoice
}) => {
  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="font-orbitron text-xl text-cyan-400">Speakers</h2>
      <div className="space-y-4">
        {speakers.map(speaker => (
            <SpeakerEditor 
                key={speaker.id}
                speaker={speaker}
                onSpeakerChange={onSpeakerChange}
                onDelete={() => onDeleteSpeaker(speaker.id)}
                canDelete={speakers.length > 1}
                onConfigureCustomVoice={onConfigureCustomVoice}
            />
        ))}
      </div>

      <button
        onClick={onAddSpeaker}
        className="w-full flex justify-center items-center gap-2 text-slate-400 hover:text-cyan-400 border-2 border-dashed border-slate-600 hover:border-cyan-500 rounded-lg py-3 transition-colors"
      >
        <IconAdd />
        <span>Add Speaker</span>
      </button>
    </div>
  );
};


import React, { useState, useCallback, Fragment } from 'react';
import type { Speaker, Dialog } from '../types';
import { generateScriptFromText } from '../services/aiScriptService';
import { IconSparkles, IconSpinner } from './icons';

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (speakers: Speaker[], dialogs: Dialog[]) => void;
}

const placeholderScript = `[2:30 PM] Sarah: Hey, did you see the latest trailer for "Cosmic Drift"? It looks insane!
[2:31 PM] Mark: No way, I missed it! I'm swamped with these TPS reports. How was it?
[2:32 PM] Sarah: The zero-g chase scene looked so good.
[2:33 PM] Mark: (laughing) Don't worry, I'll save you a seat for opening night.`;

const placeholderPrompt = `Five people are sitting around a massive television, sharing a joint and playing Need For Speed. One guy is obsessively showing off a program he created with AI while the others try to focus on the race.`;


export const AiModal: React.FC<AiModalProps> = ({ isOpen, onClose, onGenerate }) => {
    const [scriptText, setScriptText] = useState('');
    const [instructions, setInstructions] = useState('');
    const [useSteering, setUseSteering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateScriptFromText(scriptText, instructions, useSteering);
            if (!result || !result.speakers || !result.dialogs) {
                throw new Error("AI returned an invalid script structure.");
            }
            onGenerate(result.speakers, result.dialogs);
        } catch (err) {
            console.error("AI Script Generation Failed:", err);
            let errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            
            if (errorMessage.includes("JSON") || errorMessage.includes("parse")) {
                errorMessage = "The AI had trouble formatting this script. Try a simpler description or shorter prompt.";
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [scriptText, instructions, useSteering, onGenerate]);
    
    const handleUseChatExample = () => {
        setScriptText(placeholderScript);
        setInstructions("Sarah is enthusiastic. Mark is tired and sarcastic.")
    }

    const handleUsePromptExample = () => {
        setScriptText(placeholderPrompt);
        setInstructions("Create a 15-line script. Make the vibe relaxed and slightly chaotic.")
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" aria-modal="true" role="dialog">
            <div 
                className="relative w-full max-w-2xl bg-slate-900/80 border border-slate-700/50 rounded-xl shadow-2xl shadow-cyan-500/10 animate-fade-in"
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <h2 className="font-orbitron text-lg text-cyan-400 flex items-center gap-3">
                        <IconSparkles />
                        AI Script Generator
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl px-2">&times;</button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label htmlFor="script-input" className="block text-sm font-medium text-slate-300 mb-2">
                           Paste text OR Describe a scene
                        </label>
                        <textarea
                            id="script-input"
                            rows={8}
                            value={scriptText}
                            onChange={(e) => setScriptText(e.target.value)}
                            placeholder="Example: 'A detective and a thief argue in a rainy alleyway...' or paste a WhatsApp chat."
                            className="w-full bg-slate-800/50 border border-slate-600 rounded-md p-3 text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                        <div className="flex gap-4 mt-2">
                            <button onClick={handleUseChatExample} className="text-xs text-slate-400 hover:text-cyan-400 underline decoration-slate-600">
                                Example: Format Chat
                            </button>
                            <button onClick={handleUsePromptExample} className="text-xs text-slate-400 hover:text-cyan-400 underline decoration-slate-600">
                                Example: Describe a Scene
                            </button>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="instructions-input" className="block text-sm font-medium text-slate-300 mb-2">
                           Extra Instructions (Tone, Language, Pacing)
                        </label>
                        <input
                            id="instructions-input"
                            type="text"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="e.g. 'Make it funny', 'Use Hebrew slang', 'Fast-paced dialogue'"
                            className="w-full bg-slate-800/50 border border-slate-600 rounded-md px-3 py-2 text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                    </div>
                    <div className="flex items-center gap-2 mt-4 select-none">
                        <input
                            type="checkbox"
                            id="steering-checkbox"
                            checked={useSteering}
                            onChange={(e) => setUseSteering(e.target.checked)}
                            className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500"
                        />
                        <label htmlFor="steering-checkbox" className="text-sm font-medium text-slate-300 cursor-pointer">
                            Enable Typographical & Phonetic Steering (Emotions, Stutters, Elongation)
                        </label>
                    </div>

                    {error && (
                         <div className="bg-red-900/50 border border-red-700/50 text-red-300 text-sm rounded-md p-3">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>

                <div className="flex justify-end p-4 border-t border-slate-700/50 bg-slate-900/50 rounded-b-xl">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !scriptText}
                        className="flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)]"
                    >
                        {isLoading ? <><IconSpinner size={20} /><span>Writing Script...</span></> : <> <IconSparkles size={16}/><span>Generate Script</span> </>}
                    </button>
                </div>
            </div>
        </div>
    );
};

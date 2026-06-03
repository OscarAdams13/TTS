import React, { useState } from 'react';
import { generateVoiceCloningKey } from '../services/customVoiceService';

interface CustomVoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    gcpToken?: string;
    gcpProjectId?: string;
    onSaveKey: (voiceKey: string) => void;
}

export const CustomVoiceModal: React.FC<CustomVoiceModalProps> = ({ isOpen, onClose, gcpToken, gcpProjectId, onSaveKey }) => {
    const [referenceFile, setReferenceFile] = useState<File | null>(null);
    const [consentFile, setConsentFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleCreateVoice = async () => {
        if (!gcpToken) {
            setError("GCP Token is missing. Please set it in Settings.");
            return;
        }
        if (!referenceFile || !consentFile) {
            setError("Please upload both Reference Audio and Consent Audio.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const refB64 = await fileToBase64(referenceFile);
            const consentB64 = await fileToBase64(consentFile);

            const voiceKey = await generateVoiceCloningKey(gcpToken, gcpProjectId, refB64, consentB64);
            
            setSuccessMessage("Voice clone generated successfully!");
            setTimeout(() => {
                onSaveKey(voiceKey);
                onClose();
            }, 1500);

        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-orbitron text-lg text-cyan-400">Configure Instant Custom Voice</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                        Upload high-quality 10-second LINEAR16, WAV, MP3 or M4A audio files.
                    </p>

                    <div>
                        <label className="text-sm font-semibold text-gray-200 block mb-1">
                            Consent Statement Audio
                        </label>
                        <p className="text-xs text-orange-400 mb-2 font-mono">
                            Required text: "I am the owner of this voice and I consent to Google using this voice to create a synthetic voice model."
                        </p>
                        <input 
                            type="file" 
                            accept="audio/wav,audio/mp3,audio/m4a,audio/*"
                            onChange={(e) => setConsentFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-200 block mb-1">
                            Reference Audio
                        </label>
                        <p className="text-xs text-slate-400 mb-2">
                            A clear ~10s recording of your voice speaking energetically and dynamically.
                        </p>
                        <input 
                            type="file" 
                            accept="audio/wav,audio/mp3,audio/m4a,audio/*"
                            onChange={(e) => setReferenceFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-700/50 text-red-300 text-sm rounded-md p-3 mt-2">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="bg-green-900/50 border border-green-700/50 text-green-300 text-sm rounded-md p-3 mt-2">
                            {successMessage}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleCreateVoice}
                        disabled={isLoading}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Creating...' : 'Create Voice'}
                    </button>
                </div>
            </div>
        </div>
    );
};

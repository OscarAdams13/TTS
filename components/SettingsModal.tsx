import React from 'react';
import type { GlobalSettings } from '../types';
import { IconSettings, IconCheck } from './icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: GlobalSettings;
    onSettingsChange: (settings: GlobalSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
    if (!isOpen) return null;

    const handleChange = <K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-orbitron text-lg text-cyan-400 flex items-center gap-2">
                        <IconSettings />
                        Studio Settings
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </div>

                <div className="space-y-6">
                    {/* Line by Line Toggle */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-200 block mb-1">
                                Force Line-by-Line Generation
                            </label>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                By default, 2-speaker scripts use a specialized model for smoother flow. 
                                Enabling this forces each line to be generated individually. 
                                <br/><span className="text-orange-400 mt-1 inline-block">Required for inserting gaps.</span>
                            </p>
                        </div>
                        <button 
                            onClick={() => handleChange('forceLineByLine', !settings.forceLineByLine)}
                            className={`flex-shrink-0 w-12 h-6 rounded-full transition-colors relative ${settings.forceLineByLine ? 'bg-cyan-600' : 'bg-slate-700'}`}
                        >
                            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.forceLineByLine ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Gap Slider */}
                    <div className={`transition-opacity duration-300 ${settings.forceLineByLine ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-semibold text-gray-200">
                                Gap Between Lines
                            </label>
                            <span className="text-xs text-cyan-400 font-mono bg-cyan-900/30 px-2 py-1 rounded">
                                {settings.lineGap} ms
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="2000"
                            step="100"
                            value={settings.lineGap}
                            onChange={(e) => handleChange('lineGap', parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Only applies when Line-by-Line generation is active.
                        </p>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-700">
                        <label className="text-sm font-semibold text-gray-200 block mb-1">
                            Google Cloud Token (For Instant Custom Voice)
                        </label>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">
                            Provide your GCP Bearer token or API key to use Chirp 3 Voice Cloning.
                        </p>
                        <input
                            type="password"
                            value={settings.gcpToken || ''}
                            onChange={(e) => handleChange('gcpToken', e.target.value)}
                            placeholder="ya29.a0..."
                            className="w-full bg-slate-800/50 border border-slate-600 rounded-md px-3 py-2 text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition mb-3"
                        />
                        <label className="text-sm font-semibold text-gray-200 block mb-1">
                            GCP Project ID (Optional)
                        </label>
                        <input
                            type="text"
                            value={settings.gcpProjectId || ''}
                            onChange={(e) => handleChange('gcpProjectId', e.target.value)}
                            placeholder="my-project-123"
                            className="w-full bg-slate-800/50 border border-slate-600 rounded-md px-3 py-2 text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
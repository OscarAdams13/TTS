import React from 'react';
import { IconDownload, IconUpload, IconSparkles, IconSettings } from './icons';

interface HeaderProps {
    onSave: () => void;
    onLoad: () => void;
    onAiClick: () => void;
    onSettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSave, onLoad, onAiClick, onSettingsClick }) => {
    return (
        <header className="flex-shrink-0 flex items-center justify-between p-4 bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-20">
            <h1 className="font-orbitron text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-bold tracking-wide flex items-center gap-2">
                Cine-log <span className="text-xs text-slate-400 font-sans font-normal tracking-normal hidden md:inline-block">Agentic dialog and speech</span>
            </h1>
            <div className="flex items-center gap-3">
                 <button onClick={onAiClick} title="Automatic AI Script" className="text-slate-300 hover:text-cyan-300 p-2 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 px-3 group">
                    <IconSparkles size={18} className="text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                    <span className="text-sm font-semibold">AI Writer</span>
                </button>
                <div className="w-px h-6 bg-slate-700 mx-1"></div>
                <button onClick={onSettingsClick} title="Studio Settings" className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                    <IconSettings size={20} />
                </button>
                <button onClick={onSave} title="Save Project" className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                    <IconDownload size={20} />
                </button>
                <button onClick={onLoad} title="Load Project" className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                    <IconUpload size={20} />
                </button>
            </div>
        </header>
    );
};
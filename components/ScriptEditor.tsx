import React, { useRef, useEffect } from 'react';
import type { Dialog, Speaker } from '../types';
import { STYLE_PRESETS } from '../constants';
import { IconScript, IconTrash, IconAdd, IconChevronDown } from './icons';

interface ScriptEditorProps {
  dialogs: Dialog[];
  speakers: Speaker[];
  onDialogChange: (dialog: Dialog) => void;
  onAddDialog: () => void;
  onDeleteDialog: (dialogId: string) => void;
}

const AutoGrowTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [props.value]);

  return <textarea ref={ref} rows={1} {...props} />;
};


const SpeakerSelector: React.FC<{
  speakers: Speaker[];
  selectedSpeakerId: string;
  onChange: (speakerId: string) => void;
}> = ({ speakers, selectedSpeakerId, onChange }) => {
  const selectedSpeaker = speakers.find(s => s.id === selectedSpeakerId) ?? speakers[0];
  if (!selectedSpeaker) return null;

  return (
    <div className="flex-shrink-0 relative group">
        <select
          value={selectedSpeakerId}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-transparent font-semibold py-1 pr-8 rounded-md focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          style={{ color: selectedSpeaker.color }}
          aria-label="Select Speaker"
        >
          {speakers.map(s => (
            <option key={s.id} value={s.id} className="bg-slate-800 text-white">
              {s.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none" style={{ color: selectedSpeaker.color }}>
            <IconChevronDown size={16} />
        </div>
    </div>
  );
};

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ 
    dialogs, 
    speakers, 
    onDialogChange, 
    onAddDialog,
    onDeleteDialog
}) => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
      <div className="flex items-center gap-3 text-2xl text-cyan-400 mb-6 sticky top-0 bg-slate-900/95 py-4 z-10 backdrop-blur-sm border-b border-slate-800">
        <IconScript size={28}/>
        <h2 className="font-orbitron">Script Editor</h2>
      </div>

      <div className="space-y-8">
        {dialogs.map((dialog) => (
          <div key={dialog.id} className="group relative bg-slate-800/20 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex items-start gap-4">
                <div className="w-32 pt-1 flex-shrink-0">
                  <SpeakerSelector
                      speakers={speakers}
                      selectedSpeakerId={dialog.speakerId}
                      onChange={(speakerId) => onDialogChange({ ...dialog, speakerId })}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="relative">
                         <input
                            type="text"
                            value={dialog.style || ''}
                            onChange={(e) => onDialogChange({ ...dialog, style: e.target.value })}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-cyan-400/80 text-sm resize-none italic placeholder-slate-600 focus:placeholder-slate-500"
                            placeholder="Add direction (e.g., cheerfully, whispering)"
                            aria-label="Dialogue direction"
                        />
                    </div>
                    
                    {/* Style Chips */}
                    <div className="flex flex-wrap gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 h-0 group-focus-within:h-auto overflow-hidden">
                        {STYLE_PRESETS.map(preset => (
                            <button
                                key={preset}
                                onClick={() => onDialogChange({ ...dialog, style: preset })}
                                className={`text-xs px-2 py-1 rounded-full border border-slate-700 hover:border-cyan-500 transition-colors ${dialog.style === preset ? 'bg-cyan-900/50 text-cyan-300 border-cyan-500' : 'text-slate-400 hover:text-cyan-400'}`}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>

                    <AutoGrowTextarea
                      value={dialog.text}
                      onChange={(e) => onDialogChange({ ...dialog, text: e.target.value })}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-gray-200 text-lg resize-none leading-relaxed placeholder-slate-600"
                      placeholder="Enter dialogue..."
                    />
                </div>
                <button 
                  onClick={() => onDeleteDialog(dialog.id)} 
                  className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-2 p-2 rounded-full hover:bg-slate-800"
                  aria-label="Delete dialog"
                >
                  <IconTrash />
                </button>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={onAddDialog}
        className="mt-8 flex items-center justify-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors w-full py-4 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg group"
      >
        <div className="p-2 bg-slate-800 rounded-full group-hover:bg-cyan-900/30 transition-colors">
            <IconAdd />
        </div>
        <span className="font-semibold">Add Dialog Line</span>
      </button>
    </div>
  );
};
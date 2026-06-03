import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ScriptEditor } from './components/ScriptEditor';
import { SpeakerPanel } from './components/SpeakerPanel';
import { AudioOutput } from './components/AudioOutput';
import { AiModal } from './components/AiModal';
import { SettingsModal } from './components/SettingsModal';
import { CustomVoiceModal } from './components/CustomVoiceModal';
import { generateSpeech } from './services/ttsService';
import { createAudioUrl } from './utils/audioUtils';
import { INITIAL_SPEAKERS, INITIAL_DIALOGS, SPEAKER_COLORS, DEFAULT_SETTINGS } from './constants';
import type { Dialog, Speaker, GlobalSettings } from './types';

function App() {
  const [speakers, setSpeakers] = useState<Speaker[]>(INITIAL_SPEAKERS);
  const [dialogs, setDialogs] = useState<Dialog[]>(INITIAL_DIALOGS);
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  const [customVoiceConfigTargetId, setCustomVoiceConfigTargetId] = useState<string | null>(null);

  useEffect(() => {
    // Clean up Blob URL when component unmounts or audioSrc changes
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [audioSrc]);

  const handleSpeakerChange = useCallback((updatedSpeaker: Speaker) => {
    setSpeakers(prev => prev.map(s => s.id === updatedSpeaker.id ? updatedSpeaker : s));
  }, []);

  const handleAddSpeaker = useCallback(() => {
    const newSpeakerId = `speaker-${Date.now()}`;
    const newSpeaker: Speaker = {
      id: newSpeakerId,
      name: `Speaker ${speakers.length + 1}`,
      voice: 'kore',
      color: SPEAKER_COLORS[speakers.length % SPEAKER_COLORS.length],
      personality: '',
    };
    setSpeakers(prev => [...prev, newSpeaker]);
  }, [speakers]);

  const handleDeleteSpeaker = useCallback((speakerId: string) => {
    // Prevent deleting the last speaker
    if (speakers.length <= 1) {
        return;
    }

    const speakersAfterDelete = speakers.filter(s => s.id !== speakerId);
    const remainingSpeakerId = speakersAfterDelete[0]?.id;

    // Reassign dialogs from the deleted speaker to the remaining one
    if (remainingSpeakerId) {
        const updatedDialogs = dialogs.map(d =>
            d.speakerId === speakerId ? { ...d, speakerId: remainingSpeakerId } : d
        );
        setDialogs(updatedDialogs);
    }

    setSpeakers(speakersAfterDelete);
  }, [speakers, dialogs]);

  const handleConfigureCustomVoice = useCallback((speakerId: string) => {
      setCustomVoiceConfigTargetId(speakerId);
  }, []);

  const handleSaveCustomVoiceKey = useCallback((voiceKey: string) => {
      if (!customVoiceConfigTargetId) return;
      setSpeakers(prev => prev.map(s => s.id === customVoiceConfigTargetId ? { ...s, customVoiceKey: voiceKey } : s));
  }, [customVoiceConfigTargetId]);

  const handleDialogChange = useCallback((updatedDialog: Dialog) => {
    setDialogs(prev => prev.map(d => d.id === updatedDialog.id ? updatedDialog : d));
  }, []);
  
  const handleAddDialog = useCallback(() => {
    if (speakers.length === 0) return;
    
    // Smart speaker rotation: try to pick a speaker different from the last one
    let nextSpeakerId = speakers[0].id;
    if (dialogs.length > 0) {
        const lastSpeakerId = dialogs[dialogs.length - 1].speakerId;
        // Find index of last speaker
        const lastSpeakerIndex = speakers.findIndex(s => s.id === lastSpeakerId);
        // Pick next one in cyclic order
        if (lastSpeakerIndex >= 0) {
            nextSpeakerId = speakers[(lastSpeakerIndex + 1) % speakers.length].id;
        }
    }

    const newDialog: Dialog = {
      id: `dialog-${Date.now()}`,
      speakerId: nextSpeakerId,
      text: '',
      style: ''
    };
    setDialogs(prev => [...prev, newDialog]);
  }, [speakers, dialogs]);

  const handleDeleteDialog = useCallback((dialogId: string) => {
    setDialogs(prev => prev.filter(d => d.id !== dialogId));
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (audioSrc) {
      URL.revokeObjectURL(audioSrc);
      setAudioSrc(null);
    }

    try {
      const base64Audio = await generateSpeech(speakers, dialogs, settings);
      const url = createAudioUrl(base64Audio);
      setAudioSrc(url);
    } catch (err) {
      console.error("Speech generation failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [speakers, dialogs, audioSrc, settings]);

  const handleSaveProject = useCallback(() => {
    const projectData = { speakers, dialogs, settings };
    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gemini-tts-project.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [speakers, dialogs, settings]);

  const handleLoadProject = useCallback(() => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const text = e.target?.result;
                  if (typeof text !== 'string') throw new Error("Invalid file content");
                  const data = JSON.parse(text);

                  if (Array.isArray(data.speakers) && Array.isArray(data.dialogs)) {
                      setSpeakers(data.speakers);
                      setDialogs(data.dialogs);
                      if (data.settings) {
                          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
                      }
                      
                      if (audioSrc) URL.revokeObjectURL(audioSrc);
                      setAudioSrc(null);
                      setError(null);
                  } else {
                      throw new Error("Invalid project file format");
                  }
              } catch (err) {
                  console.error("Failed to load project:", err);
                  setError(err instanceof Error ? err.message : "Failed to load project file.");
              }
          };
          reader.onerror = () => {
               setError("Error reading file.");
          }
          reader.readAsText(file);
      };
      input.click();
  }, [audioSrc]);

  const handleAiGenerate = useCallback((newSpeakers: Speaker[], newDialogs: Dialog[]) => {
      if (newSpeakers.length > 0 && newDialogs.length > 0) {
        setSpeakers(newSpeakers);
        setDialogs(newDialogs);
        if (audioSrc) URL.revokeObjectURL(audioSrc);
        setAudioSrc(null);
        setError(null);
        setIsAiModalOpen(false);
      } else {
        setError("AI generation resulted in an empty script.");
      }
  }, [audioSrc]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-gray-200">
      <Header 
        onSave={handleSaveProject} 
        onLoad={handleLoadProject} 
        onAiClick={() => setIsAiModalOpen(true)} 
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
        {/* Main Content: Script Editor */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <ScriptEditor
            dialogs={dialogs}
            speakers={speakers}
            onDialogChange={handleDialogChange}
            onAddDialog={handleAddDialog}
            onDeleteDialog={handleDeleteDialog}
          />
        </main>

        {/* Sidebar: Speaker Panel */}
        <aside className="w-full md:w-80 lg:w-96 bg-slate-900/40 p-4 sm:p-6 border-t md:border-t-0 md:border-l border-slate-800 overflow-y-auto scrollbar-thin">
          <SpeakerPanel
            speakers={speakers}
            onSpeakerChange={handleSpeakerChange}
            onAddSpeaker={handleAddSpeaker}
            onDeleteSpeaker={handleDeleteSpeaker}
            onConfigureCustomVoice={handleConfigureCustomVoice}
          />
        </aside>
      </div>

      {/* Footer: Audio Output and Controls */}
      <AudioOutput
        audioSrc={audioSrc}
        isLoading={isLoading}
        error={error}
        onGenerate={handleGenerate}
      />

      <AiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onGenerate={handleAiGenerate}
      />
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      <CustomVoiceModal
        isOpen={customVoiceConfigTargetId !== null}
        onClose={() => setCustomVoiceConfigTargetId(null)}
        gcpToken={settings.gcpToken}
        gcpProjectId={settings.gcpProjectId}
        onSaveKey={handleSaveCustomVoiceKey}
      />
    </div>
  );
}

export default App;
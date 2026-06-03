import React, { useRef, useEffect, useCallback, useState } from 'react';
import { IconPlay, IconDownload, IconSpinner } from './icons';

interface AudioOutputProps {
  audioSrc: string | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center gap-3 text-cyan-400">
        <IconSpinner size={20} />
        <span className="animate-pulse">Synthesizing audio...</span>
    </div>
);

export const AudioOutput: React.FC<AudioOutputProps> = ({ 
    audioSrc, 
    isLoading, 
    error,
    onGenerate, 
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [playbackRate, setPlaybackRate] = useState(1.0);

    const visualizationState = useRef<{
        audioContext: AudioContext | null;
        analyser: AnalyserNode | null;
        source: MediaElementAudioSourceNode | null;
        animationFrameId: number | null;
    }>({
        audioContext: null,
        analyser: null,
        source: null,
        animationFrameId: null,
    }).current;

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rate = parseFloat(e.target.value);
        setPlaybackRate(rate);
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
        }
    };

    const drawVisualizer = useCallback((
        analyser: AnalyserNode | null, 
        canvasCtx: CanvasRenderingContext2D, 
        width: number, 
        height: number
    ) => {
        canvasCtx.clearRect(0, 0, width, height);

        if (!analyser) {
            const barWidth = 3;
            const gap = 2;
            const numBars = Math.floor(width / (barWidth + gap));
            canvasCtx.fillStyle = 'rgba(71, 85, 105, 0.4)'; // slate-500
            for (let i = 0; i < numBars; i++) {
                const x = i * (barWidth + gap);
                const barHeight = Math.random() * 4 + 2;
                canvasCtx.fillRect(x, height / 2 - barHeight / 2, barWidth, barHeight);
            }
            return;
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height * 0.8;
            
            const gradient = canvasCtx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, '#06b6d4'); // cyan-500
            gradient.addColorStop(0.5, '#22d3ee'); // cyan-400
            gradient.addColorStop(1, '#a5f3fc'); // cyan-200
            canvasCtx.fillStyle = gradient;

            // Center the bars
            canvasCtx.fillRect(x, height / 2 - barHeight / 2, barWidth, barHeight);
            x += barWidth + 1;
        }
    }, []);

    const loop = useCallback(() => {
        const { analyser } = visualizationState;
        const canvas = canvasRef.current;
        if (analyser && canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
               drawVisualizer(analyser, ctx, canvas.width, canvas.height);
            }
        }
        visualizationState.animationFrameId = requestAnimationFrame(loop);
    }, [drawVisualizer, visualizationState]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                drawVisualizer(null, ctx, canvas.width, canvas.height);
            }
        }
    }, [audioSrc, drawVisualizer]);

    useEffect(() => {
        const audioEl = audioRef.current;

        const handlePlay = () => {
            const { audioContext, source } = visualizationState;

            if (!audioContext) {
                try {
                    const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    visualizationState.audioContext = newAudioContext;

                    const newAnalyser = newAudioContext.createAnalyser();
                    newAnalyser.fftSize = 64; // Low FFT size for chunkier bars
                    newAnalyser.smoothingTimeConstant = 0.8;
                    visualizationState.analyser = newAnalyser;

                    newAnalyser.connect(newAudioContext.destination);
                } catch (e) {
                    console.error("Could not create AudioContext", e);
                    return;
                }
            }
            
            if (visualizationState.audioContext?.state === 'suspended') {
                 visualizationState.audioContext.resume();
            }

            if (audioEl && (!source || source.mediaElement !== audioEl)) {
                 if (source) {
                    source.disconnect();
                 }
                 try {
                     const newSource = visualizationState.audioContext.createMediaElementSource(audioEl);
                     visualizationState.source = newSource;
                     newSource.connect(visualizationState.analyser!);
                 } catch(e) {
                     console.error("Error creating media element source", e);
                     return;
                 }
            }
            
            if (visualizationState.animationFrameId) {
                cancelAnimationFrame(visualizationState.animationFrameId);
            }
            visualizationState.animationFrameId = requestAnimationFrame(loop);
        };

        const handlePauseOrEnd = () => {
             if (visualizationState.animationFrameId) {
                cancelAnimationFrame(visualizationState.animationFrameId);
                visualizationState.animationFrameId = null;
            }
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    drawVisualizer(null, ctx, canvas.width, canvas.height);
                }
            }
        };

        if (audioEl) {
            audioEl.playbackRate = playbackRate;
            audioEl.addEventListener('play', handlePlay);
            audioEl.addEventListener('pause', handlePauseOrEnd);
            audioEl.addEventListener('ended', handlePauseOrEnd);
        }

        return () => {
            if (audioEl) {
                audioEl.removeEventListener('play', handlePlay);
                audioEl.removeEventListener('pause', handlePauseOrEnd);
                audioEl.removeEventListener('ended', handlePauseOrEnd);
            }
            if (visualizationState.animationFrameId) {
                cancelAnimationFrame(visualizationState.animationFrameId);
            }
        };
    }, [audioSrc, loop, drawVisualizer, visualizationState]);

    useEffect(() => {
        return () => {
            visualizationState.source?.disconnect();
            visualizationState.analyser?.disconnect();
            if (visualizationState.audioContext && visualizationState.audioContext.state !== 'closed') {
                visualizationState.audioContext.close().catch(console.error);
            }
        }
    }, [visualizationState]);
    
    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner />;
        }
        if (error) {
            return <div className="text-red-400 text-sm truncate font-medium" title={error}>{error}</div>;
        }

        const visualizerCanvas = (
            <canvas 
                ref={canvasRef} 
                width="200" 
                height="48" 
                className="rounded bg-slate-900/50 border border-slate-700/50 shadow-inner"
                aria-label="Audio visualizer"
            ></canvas>
        );

        if (audioSrc) {
            return (
                <div className="flex items-center gap-4 w-full">
                    <div className="flex-shrink-0">
                         {visualizerCanvas}
                    </div>
                    
                    <audio ref={audioRef} controls src={audioSrc} className="flex-1 h-10 rounded-lg">
                      Your browser does not support the audio element.
                    </audio>
                    
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-2 py-1 border border-slate-700">
                        <span className="text-xs text-slate-400 font-mono w-8 text-right">{playbackRate}x</span>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="2.0" 
                            step="0.1" 
                            value={playbackRate} 
                            onChange={handleRateChange}
                            className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            title="Playback Speed"
                        />
                    </div>

                    <a
                      href={audioSrc}
                      download="gemini-tts-studio.wav"
                      title="Download audio"
                      className="flex-shrink-0 text-slate-400 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-slate-700 border border-transparent hover:border-slate-600"
                    >
                      <IconDownload size={20} />
                    </a>
                </div>
            );
        }
        return (
             <div className="flex items-center gap-4 w-full">
                {visualizerCanvas}
                <div className="text-slate-500 flex-1 italic">Write your script and click Generate to listen...</div>
            </div>
        );
    };

    return (
        <div className="flex-shrink-0 flex items-center justify-between p-4 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md gap-4 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-20">
            <div className="flex-1 min-w-0">
                {renderContent()}
            </div>
            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] transform hover:scale-105 active:scale-95"
            >
                {isLoading ? <IconSpinner /> : <IconPlay />}
                <span>Generate Audio</span>
            </button>
        </div>
    );
};
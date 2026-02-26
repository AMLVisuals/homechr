import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import HoverPlugin from 'wavesurfer.js/dist/plugins/hover.esm.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  FastForward, 
  Rewind, 
  ZoomIn, 
  ZoomOut,
  Activity,
  Repeat,
  Trash2
} from 'lucide-react';

interface AudioWaveformViewerProps {
  url: string;
  name: string;
}

export function AudioWaveformViewer({ url, name }: AudioWaveformViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [zoom, setZoom] = useState(50); // minPxPerSec
  const [isReady, setIsReady] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const isLoopingRef = useRef(isLooping);
  const [activeRegion, setActiveRegion] = useState<any>(null);
  const lastSeekRef = useRef<number>(0);
  const stopAtRef = useRef<number | null>(null);
  const normalizingRef = useRef<boolean>(false);
  const activeRegionRef = useRef<any>(null);
  const manualPauseRef = useRef<boolean>(false);
  const selectingRef = useRef<boolean>(false);

  // Update ref when state changes
  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current || !timelineRef.current) return;

    // Clean up previous instance if exists
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    // Initialize Regions Plugin
    const wsRegions = RegionsPlugin.create();
    regionsPluginRef.current = wsRegions;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4ade80', // Pro Tools-ish Green
      progressColor: '#22c55e',
      cursorColor: '#ef4444', // Red cursor
      barWidth: 2,
      barGap: 1,
      barRadius: 0,
      height: 120, // Reduced height for compact view
      url: url,
      minPxPerSec: zoom,
      normalize: true,
      autoScroll: true,
      autoCenter: true,
      interact: true, // Ensure interaction is enabled
      backend: 'WebAudio',
      plugins: [
        TimelinePlugin.create({
          container: timelineRef.current,
          formatTimeCallback: (seconds) => {
             const m = Math.floor(seconds / 60);
             const s = Math.floor(seconds % 60);
             return `${m}:${s.toString().padStart(2, '0')}`;
          },
          primaryLabelInterval: 5,
          secondaryLabelInterval: 1,
          style: {
            fontSize: '9px',
            color: '#6b7280',
          },
        }),
        HoverPlugin.create({
          lineColor: '#ffffff',
          lineWidth: 2,
          labelBackground: '#000000',
          labelColor: '#ffffff',
          labelSize: '10px',
        }),
        wsRegions,
      ],
    });

    wavesurfer.on('load', () => {
      setIsReady(false);
    });

    wavesurfer.on('ready', () => {
      setDuration(wavesurfer.getDuration());
      setIsReady(true);
      wavesurferRef.current = wavesurfer;
      wavesurfer.setVolume(isMuted ? 0 : volume);
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => {
      const region = activeRegionRef.current;
      if (
        region &&
        isLoopingRef.current &&
        !manualPauseRef.current
      ) {
        const t = wavesurfer.getCurrentTime();
        const epsilon = 0.005;
        if (Math.abs(t - region.end) <= epsilon) {
          region.play(true);
          setIsPlaying(true);
          return;
        }
      }
      manualPauseRef.current = false;
      setIsPlaying(false);
    });
    wavesurfer.on('timeupdate', (currentTime) => {
      setCurrentTime(currentTime);
      if (stopAtRef.current != null && currentTime >= stopAtRef.current) {
        wavesurfer.pause();
        setIsPlaying(false);
        stopAtRef.current = null;
      }
    });
    
    // Handle Global Loop (End of track)
    wavesurfer.on('finish', () => {
      if (isLoopingRef.current) {
         wavesurfer.play();
      } else {
         setIsPlaying(false);
      }
    });

    wsRegions.enableDragSelection({ color: 'rgba(0, 200, 255, 0.3)' });
    wsRegions.on('region-initialized', () => {
      selectingRef.current = true;
    });
    wavesurfer.on('seek', (progress) => {
      const time = wavesurfer.getDuration() * progress;
      setCurrentTime(time);
      lastSeekRef.current = time;
    });

    wavesurfer.on('interaction', (newTime) => {
      const time = typeof newTime === 'number' ? newTime : wavesurfer.getCurrentTime();
      if (!selectingRef.current) {
        regionsPluginRef.current?.clearRegions();
        setActiveRegion(null);
        activeRegionRef.current = null;
        lastSeekRef.current = time;
        manualPauseRef.current = false;
        wavesurfer.play(time);
        setIsPlaying(true);
      }
    });

    // Region Events
    wsRegions.on('region-created', (region) => {
      if (normalizingRef.current) return;
      normalizingRef.current = true;
      const start = region.start;
      const end = region.end;
      wsRegions.clearRegions();
      const single = wsRegions.addRegion({ start, end, color: 'rgba(0, 200, 255, 0.3)' });
      setActiveRegion(single);
      activeRegionRef.current = single;
      normalizingRef.current = false;
      selectingRef.current = false;
    });

    wsRegions.on('region-clicked', (region, e) => {
      e.stopPropagation();
      setActiveRegion(region);
      activeRegionRef.current = region;
      wavesurfer.setTime(region.start);
      setCurrentTime(region.start);
      lastSeekRef.current = region.start;
      // Ne pas jouer automatiquement; Play déclenchera la lecture de la sélection
    });

    wsRegions.on('region-updated', (region) => {
      setActiveRegion(region);
      activeRegionRef.current = region;
    });

    

    return () => {
      wavesurfer.destroy();
    };
  }, [url]); // Re-init on URL change

  const togglePlay = useCallback(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    if (ws.isPlaying()) {
      manualPauseRef.current = true;
      ws.pause();
      setIsPlaying(false);
      stopAtRef.current = null;
      return;
    }
    if (activeRegionRef.current) {
      activeRegionRef.current.play(true);
      setIsPlaying(true);
      return;
    }
    if (lastSeekRef.current && lastSeekRef.current > 0) {
      ws.setTime(lastSeekRef.current);
    }
    ws.play();
    setIsPlaying(true);
  }, [activeRegion]);

  // Handle Zoom Changes
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(zoom);
    }
  }, [zoom]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (wavesurferRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      wavesurferRef.current.setVolume(newMuted ? 0 : volume);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    wavesurferRef.current?.setVolume(newVolume);
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseInt(e.target.value));
  };

  const clearSelection = () => {
    if (regionsPluginRef.current) {
      regionsPluginRef.current.clearRegions();
      setActiveRegion(null);
      activeRegionRef.current = null;
    }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto bg-[#1e1e1e] text-gray-300 rounded-xl overflow-hidden shadow-2xl border border-[#333] relative my-4 ring-1 ring-white/5 transition-all duration-300 ease-in-out">
      
      {/* Main Waveform Area */}
      <div className="relative bg-[#111] flex flex-col group min-h-[160px]">
        
        {/* Header Overlay: Name */}
        <div className="absolute top-2 left-3 z-20 flex items-center gap-2 pointer-events-none">
            <div className="px-2 py-1 bg-black/50 backdrop-blur rounded text-xs font-medium text-gray-400 border border-white/5 shadow-sm">
                {name}
            </div>
        </div>

        {/* Timeline Container */}
        <div ref={timelineRef} className="w-full h-6 bg-[#1a1a1a] border-b border-[#333] shrink-0" />
        
        {/* Waveform Container */}
        <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-center py-4">
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          )}
          <div ref={containerRef} className="w-full" />
        </div>
        
        {/* Selection Info Overlay - Compact */}
        {activeRegion && (
          <div className="absolute top-8 right-4 bg-black/80 backdrop-blur border border-white/10 rounded-lg p-2 text-[10px] font-mono flex items-center gap-3 z-20 shadow-lg animate-in fade-in slide-in-from-top-1">
             <div className="flex flex-col">
                <span className="text-gray-500 uppercase tracking-wider">Start</span>
                <span className="text-white font-medium">{formatTime(activeRegion.start)}</span>
             </div>
             <div className="w-[1px] h-6 bg-white/10"></div>
             <div className="flex flex-col">
                <span className="text-gray-500 uppercase tracking-wider">End</span>
                <span className="text-white font-medium">{formatTime(activeRegion.end)}</span>
             </div>
             <div className="w-[1px] h-6 bg-white/10"></div>
             <div className="flex flex-col">
                <span className="text-blue-500 uppercase tracking-wider">Dur</span>
                <span className="text-blue-400 font-medium">{formatTime(activeRegion.end - activeRegion.start)}</span>
             </div>
             <button onClick={clearSelection} className="hover:bg-red-500/20 hover:text-red-400 p-1.5 rounded transition-colors ml-1">
               <Trash2 className="w-3.5 h-3.5" />
             </button>
          </div>
        )}
      </div>

      {/* Compact Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#222] border-t border-[#333] gap-4">
        
        {/* Left: Transport */}
        <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-100 transform active:scale-95 shadow-md ${isPlaying ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-white text-black hover:bg-gray-200'}`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            
            <div className="flex items-center gap-1">
                <button
                    onClick={() => wavesurferRef.current?.skip(-5)}
                    className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
                    title="-5s"
                >
                    <Rewind className="w-4 h-4" />
                </button>
                <button
                    onClick={() => wavesurferRef.current?.skip(5)}
                    className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
                    title="+5s"
                >
                    <FastForward className="w-4 h-4" />
                </button>
            </div>

            <div className="w-[1px] h-5 bg-[#333]"></div>

            <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-1.5 rounded transition-colors ${isLooping ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-[#333] text-gray-500'}`}
                title="Loop"
            >
                <Repeat className="w-4 h-4" />
            </button>
        </div>

        {/* Center: Time Display */}
        <div className="flex items-center gap-1.5 font-mono text-xs bg-black/20 px-3 py-1 rounded border border-white/5">
            <span className="text-green-400 font-medium w-[50px] text-right">{formatTime(currentTime)}</span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-500 w-[50px]">{formatTime(duration)}</span>
        </div>

        {/* Right: Tools (Zoom & Volume) */}
        <div className="flex items-center gap-4">
            {/* Zoom */}
            <div className="flex items-center gap-2 group">
                <ZoomOut className="w-3 h-3 text-gray-500" />
                <input
                  type="range"
                  min="10"
                  max="500"
                  value={zoom}
                  onChange={handleZoomChange}
                  className="w-16 h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-gray-500 hover:accent-green-500 transition-all"
                />
                <ZoomIn className="w-3 h-3 text-gray-500" />
            </div>

            <div className="w-[1px] h-5 bg-[#333]"></div>

            {/* Volume */}
            <div className="flex items-center gap-2 group">
                <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-gray-500 hover:accent-green-500 transition-all"
                />
            </div>
        </div>

      </div>
    </div>
  );
}

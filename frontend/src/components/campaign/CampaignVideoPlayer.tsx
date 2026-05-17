import {
  useRef, useState, useCallback, useEffect, type RefObject,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, RotateCcw, ZoomIn,
} from "lucide-react";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITIES = ["Auto", "1080p", "720p", "480p", "360p"];

// ─────────────────────────────────────────────
// Sub-component: SeekBar
// ─────────────────────────────────────────────
function SeekBar({
  current, duration, buffered, onSeek,
}: {
  current: number; duration: number; buffered: number; onSeek: (t: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const bar = barRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSeek(getPos(e) * duration);
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const buffPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={barRef}
      className="group relative h-1 hover:h-2.5 transition-all duration-150 cursor-pointer rounded-full bg-white/20"
      onClick={handleClick}
    >
      {/* Buffered */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-white/30"
        style={{ width: `${buffPct}%` }}
      />
      {/* Played */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-white"
        style={{ width: `${pct}%` }}
      />
      {/* Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ left: `calc(${pct}% - 6px)` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-component: VolumeSlider
// ─────────────────────────────────────────────
function VolumeSlider({ volume, onChange }: { volume: number; onChange: (v: number) => void }) {
  return (
    <input
      type="range"
      min={0}
      max={1}
      step={0.05}
      value={volume}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      onClick={(e) => e.stopPropagation()}
      className="w-20 h-1 accent-white cursor-pointer"
    />
  );
}

// ─────────────────────────────────────────────
// Sub-component: SettingsMenu
// ─────────────────────────────────────────────
function SettingsMenu({
  speed, onSpeedChange, quality, onQualityChange,
}: {
  speed: number; onSpeedChange: (s: number) => void;
  quality: string; onQualityChange: (q: string) => void;
}) {
  return (
    <div
      className="absolute bottom-12 right-0 z-20 w-48 rounded-xl bg-black/90 backdrop-blur-md border border-white/10 text-white text-sm overflow-hidden shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Speed */}
      <div className="px-3 py-2 border-b border-white/10">
        <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Speed</p>
        <div className="flex flex-wrap gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                speed === s
                  ? "bg-white text-black"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
      {/* Quality */}
      <div className="px-3 py-2">
        <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Quality</p>
        <div className="flex flex-wrap gap-1">
          {QUALITIES.map((q) => (
            <button
              key={q}
              onClick={() => onQualityChange(q)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                quality === q
                  ? "bg-white text-black"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main: CampaignVideoPlayer
// ─────────────────────────────────────────────
interface CampaignVideoPlayerProps {
  videoUrl: string;
  posterUrl: string;
  title: string;
  onViewPoster?: () => void;
}

export function CampaignVideoPlayer({
  videoUrl, posterUrl, title, onViewPoster,
}: CampaignVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState("Auto");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    hideTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => { return () => { if (hideTimer.current) clearTimeout(hideTimer.current); }; }, []);

  // Sync isPlaying state with video element
  const syncPlaying = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setIsPlaying(!v.paused);
  }, []);

  // Play / Pause
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => { setIsPlaying(true); resetHideTimer(); }).catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
      setShowControls(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }
  }, [resetHideTimer]);

  // Mute
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  // Volume
  const handleVolume = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    if (val > 0 && v.muted) { v.muted = false; setIsMuted(false); }
  }, []);

  // Seek
  const handleSeek = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    setCurrentTime(t);
    resetHideTimer();
  }, [resetHideTimer]);

  // Speed
  const handleSpeed = useCallback((s: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
    setShowSettings(false);
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Replay
  const handleReplay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().then(() => { setIsPlaying(true); resetHideTimer(); }).catch(() => {});
  }, [resetHideTimer]);

  // Time update
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const v = videoRef.current;
      if (!v) return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "ArrowRight") { v.currentTime = Math.min(v.currentTime + 10, v.duration); }
      if (e.code === "ArrowLeft") { v.currentTime = Math.max(v.currentTime - 10, 0); }
      if (e.code === "ArrowUp") { handleVolume(Math.min(volume + 0.1, 1)); }
      if (e.code === "ArrowDown") { handleVolume(Math.max(volume - 0.1, 0)); }
      if (e.code === "KeyM") toggleMute({ stopPropagation: () => {} } as React.MouseEvent);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [togglePlay, handleVolume, toggleMute, volume]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (videoError) return null;

  const isEnded = currentTime > 0 && currentTime >= duration - 0.5;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black select-none"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onClick={() => {
        setShowSettings(false);
        if (!showControls) { resetHideTimer(); return; }
        togglePlay();
      }}
    >
      {/* Poster */}
      <img
        src={posterUrl}
        alt={title}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          isPlaying && videoReady ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        playsInline
        preload="metadata"
        className={`absolute inset-0 h-full w-full object-contain z-[1] transition-opacity duration-300 ${
          isPlaying && videoReady ? "opacity-100" : "opacity-0"
        }`}
        onCanPlay={() => setVideoReady(true)}
        onError={() => setVideoError(true)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onPlay={syncPlaying}
        onPause={syncPlaying}
        onEnded={() => { setIsPlaying(false); setShowControls(true); }}
      />

      {/* Centre play/replay button */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none"
          >
            {isEnded ? (
              <button
                className="pointer-events-auto h-16 w-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                onClick={handleReplay}
                aria-label="Replay"
              >
                <RotateCcw className="h-7 w-7" />
              </button>
            ) : (
              <div className="pointer-events-none h-16 w-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-right: view poster */}
      {onViewPoster && (
        <button
          className="absolute top-3 right-3 z-[8] inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
          onClick={(e) => { e.stopPropagation(); onViewPoster(); }}
          aria-label="View ad poster"
        >
          <ZoomIn className="h-3.5 w-3.5" />
          Poster
        </button>
      )}

      {/* ─── Bottom control bar ─── */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-0 left-0 right-0 z-[6] px-3 pb-3 pt-8 bg-gradient-to-t from-black/80 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Seek bar */}
            <div className="mb-2">
              <SeekBar
                current={currentTime}
                duration={duration}
                buffered={buffered}
                onSeek={handleSeek}
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2 text-white">
              {/* Play/Pause */}
              <button
                className="p-1 hover:text-white/70 transition-colors"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>

              {/* Volume */}
              <button
                className="p-1 hover:text-white/70 transition-colors"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <div className="hidden sm:block">
                <VolumeSlider volume={isMuted ? 0 : volume} onChange={handleVolume} />
              </div>

              {/* Time */}
              <span className="text-xs tabular-nums ml-1 opacity-80">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Speed badge */}
              {speed !== 1 && (
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded font-medium">
                  {speed}×
                </span>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Settings */}
              <div className="relative">
                <button
                  className="p-1 hover:text-white/70 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setShowSettings((p) => !p); }}
                  aria-label="Settings"
                >
                  <Settings className={`h-5 w-5 transition-transform duration-300 ${showSettings ? "rotate-45" : ""}`} />
                </button>
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 4 }}
                      transition={{ duration: 0.12 }}
                    >
                      <SettingsMenu
                        speed={speed}
                        onSpeedChange={handleSpeed}
                        quality={quality}
                        onQualityChange={(q) => { setQuality(q); setShowSettings(false); }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Fullscreen */}
              <button
                className="p-1 hover:text-white/70 transition-colors"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

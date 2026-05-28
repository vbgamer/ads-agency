import { Play, Pause, Image as ImageIcon } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ImageZoomModal } from "@/components/campaign/ImageZoomModal";

interface VideoAdMediaProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  companyName: string;
  companyLogo: string;
}

export const VideoAdMedia = ({
  imageUrl,
  videoUrl,
  companyName,
  companyLogo,
}: VideoAdMediaProps) => {
  const [isPosterOpen, setIsPosterOpen] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleVideoPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      const playPromise = video.play();
      if (playPromise) {
        playPromise
          .then(() => setIsVideoPlaying(true))
          .catch(() => toast.error("Unable to play this ad video"));
      } else {
        setIsVideoPlaying(true);
      }
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }
  }, []);

  const posterUrl = !posterError && imageUrl ? imageUrl : companyLogo;

  if (!videoUrl && !imageUrl) {
    return null;
  }

  return (
    <>
      {videoUrl && !videoError ? (
        // Video with poster as thumbnail overlay
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-border bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full object-cover"
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onEnded={() => setIsVideoPlaying(false)}
              onError={() => setVideoError(true)}
            />
            {/* Overlay poster with view full button (visible before play) */}
            {!isVideoPlaying && imageUrl && (
              <button
                type="button"
                onClick={() => setIsPosterOpen(true)}
                className="absolute inset-0 flex items-end justify-end p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none hover:pointer-events-auto"
                title="View full ad poster"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 text-xs text-white backdrop-blur-sm pointer-events-auto">
                  <ImageIcon className="h-3.5 w-3.5" />
                  View poster
                </span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={toggleVideoPlayback}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60 transition-colors"
          >
            {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isVideoPlaying ? "Pause ad video" : "Play ad video"}</span>
          </button>
        </div>
      ) : videoUrl && videoError ? (
        // Video failed to load - show fallback with poster
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-border bg-black">
            <img
              src={posterUrl}
              alt={`${companyName} ad`}
              className="aspect-video w-full object-contain"
            />
            <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg bg-black/70 text-white text-xs backdrop-blur-sm">
              Video playback unavailable. This may be due to format compatibility or network issues.
            </div>
            <button
              type="button"
              onClick={() => setIsPosterOpen(true)}
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              View poster
            </button>
          </div>
        </div>
      ) : (
        // Poster only (when no video)
        <button
          type="button"
          onClick={() => setIsPosterOpen(true)}
          className="relative block w-full overflow-hidden rounded-xl border border-border bg-muted/20"
        >
          <img
            src={posterUrl}
            alt={`${companyName} ad poster`}
            className="w-full max-h-72 object-contain"
            onError={() => setPosterError(true)}
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
            <ImageIcon className="h-3.5 w-3.5" />
            View ad poster
          </span>
        </button>
      )}

      <ImageZoomModal
        open={isPosterOpen}
        onClose={() => setIsPosterOpen(false)}
        imageUrl={posterUrl}
        alt={`${companyName} ad poster`}
      />
    </>
  );
};

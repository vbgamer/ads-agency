import { useRef, useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImageZoomModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

export const ImageZoomModal = ({ open, onClose, imageUrl, alt }: ImageZoomModalProps) => {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const lastTapRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const initialPinchDistRef = useRef(0);
  const initialScaleRef = useRef(1);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Reset on close
  useEffect(() => {
    if (!open) resetZoom();
  }, [open, resetZoom]);

  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
      setTranslate({ x: 0, y: 0 });
    }
  }, [scale, resetZoom]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistRef.current = Math.hypot(dx, dy);
      initialScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      // Double-tap detection
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        handleDoubleClick();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      if (scale > 1) {
        isDraggingRef.current = true;
        lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
  }, [scale, handleDoubleClick]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = Math.min(5, Math.max(1, initialScaleRef.current * (dist / initialPinchDistRef.current)));
      setScale(newScale);
      if (newScale <= 1) setTranslate({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDraggingRef.current && scale > 1) {
      const deltaX = e.touches[0].clientX - lastPosRef.current.x;
      const deltaY = e.touches[0].clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setTranslate(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    if (scale <= 1) resetZoom();
  }, [scale, resetZoom]);

  // Desktop scroll-wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    setScale(prev => {
      const next = Math.min(5, Math.max(1, prev + delta));
      if (next <= 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Desktop drag when zoomed
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      isDraggingRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current && scale > 1) {
      const deltaX = e.clientX - lastPosRef.current.x;
      const deltaY = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      setTranslate(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    }
  }, [scale]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-none w-screen h-screen p-0 border-none bg-black/95 flex items-center justify-center [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Zoom: {alt}</DialogTitle>
        </VisuallyHidden>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-foreground/20 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Zoom hint */}
        {scale <= 1 && (
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 text-xs text-muted-foreground bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
            Pinch or scroll to zoom • Double-tap to enlarge
          </p>
        )}

        {/* Image container */}
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center overflow-hidden select-none"
          style={{ touchAction: scale > 1 ? "none" : "manipulation", cursor: scale > 1 ? "grab" : "default" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-full object-contain transition-transform duration-150 ease-out"
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              pointerEvents: "none",
            }}
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

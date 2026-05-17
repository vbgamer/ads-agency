import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ZoomIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageZoomModal } from "@/components/campaign/ImageZoomModal";
import { CampaignVideoPlayer } from "@/components/campaign/CampaignVideoPlayer";

interface CampaignHeroProps {
  title: string;
  companyName: string;
  companyLogo: string;
  category: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  coverUrl?: string | null;
  adFormat?: string | null;
  isExpired: boolean;
}

export const CampaignHero = ({
  title,
  companyName,
  companyLogo,
  category,
  imageUrl,
  videoUrl,
  coverUrl,
  adFormat,
  isExpired,
}: CampaignHeroProps) => {
  const isReel = adFormat === "reel";
  const isLandscape = adFormat === "landscape";
  const hasVideo = !!videoUrl;
  const bgImage = imageUrl || coverUrl;
  const posterImage = bgImage || companyLogo;

  const [zoomOpen, setZoomOpen] = useState(false);

  const getContainerClass = () => {
    if (isReel && hasVideo)
      return "relative mx-auto max-w-sm aspect-[9/16] max-h-[80vh] overflow-hidden rounded-xl border border-border";
    if (isLandscape && hasVideo)
      return "relative w-full aspect-[16/10] overflow-hidden rounded-xl border border-border";
    return "relative w-full aspect-[16/10] md:aspect-[2/1] overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted/80 to-muted/40";
  };

  const renderImageContent = (src: string) => (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group p-6"
      onClick={() => setZoomOpen(true)}
    >
      <img
        src={src}
        alt={title}
        className="max-h-[60%] max-w-[80%] object-contain"
      />
      <p className="mt-3 text-sm font-medium text-muted-foreground">{companyName}</p>
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs text-white opacity-70 group-hover:opacity-100 transition-opacity">
        <ZoomIn className="h-3.5 w-3.5" />
        Tap to zoom
      </div>
    </div>
  );

  const mediaContent = (
    <div className="px-4">
      <div className={getContainerClass()}>
        {hasVideo ? (
          <CampaignVideoPlayer
            videoUrl={videoUrl!}
            posterUrl={posterImage}
            title={title}
            onViewPoster={() => setZoomOpen(true)}
          />
        ) : (
          renderImageContent(posterImage)
        )}
      </div>
    </div>
  );

  const topBar = (
    <div className="flex items-center justify-between px-4 py-3">
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      {isExpired && (
        <Badge className="bg-destructive text-destructive-foreground">Expired</Badge>
      )}
    </div>
  );

  const infoSection = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 pt-4 pb-2"
    >
      <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight mb-1">
        {title}
      </h1>
      <p className="text-muted-foreground text-sm">
        by <span className="text-foreground font-medium">{companyName}</span>
      </p>
    </motion.div>
  );

  return (
    <div>
      {topBar}
      {isReel && hasVideo ? (
        <div className="w-full bg-muted/30 flex items-center justify-center py-4">
          {mediaContent}
        </div>
      ) : (
        mediaContent
      )}
      {infoSection}

      <ImageZoomModal
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        imageUrl={posterImage}
        alt={title}
      />
    </div>
  );
};




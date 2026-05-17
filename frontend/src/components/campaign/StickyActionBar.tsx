import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickyActionBarProps {
  isStateLoading: boolean;
  isExpired: boolean;
  isUserLoggedIn: boolean;
  hasGrabbed: boolean;
  isGrabbing: boolean;
  trackingStatus: string;
  trackingUrl?: string | null;
  onGrabDeal: () => void;
}

export const StickyActionBar = ({
  isStateLoading,
  isExpired,
  isUserLoggedIn,
  hasGrabbed,
  isGrabbing,
  trackingStatus,
  trackingUrl,
  onGrabDeal,
}: StickyActionBarProps) => {
  const showVisitStore = hasGrabbed && trackingUrl && (trackingStatus === 'clicked' || trackingStatus === 'converted');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:relative md:mt-4">
      <div className="bg-background/95 backdrop-blur-lg border-t md:border md:rounded-2xl p-4 md:border-border safe-area-bottom space-y-2">
        <Button
          type="button"
          variant="hero"
          size="xl"
          className="w-full"
          disabled={isStateLoading || isExpired || !isUserLoggedIn || hasGrabbed || isGrabbing}
          onClick={onGrabDeal}
        >
          {isStateLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
          ) : isGrabbing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activating...</>
          ) : isExpired ? (
            "Offer Expired"
          ) : hasGrabbed ? (
            trackingStatus === "converted" ? "Conversion Pending Verification" :
            trackingStatus === "verified" ? "Cashback Credited!" :
            "Deal Activated - Awaiting Conversion"
          ) : isUserLoggedIn ? (
            "Grab Deal"
          ) : (
            "Login to Grab Deal"
          )}
        </Button>

        {showVisitStore && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => window.open(trackingUrl!, '_blank')}
          >
            Visit Store <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

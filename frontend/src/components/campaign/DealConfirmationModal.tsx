import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, ExternalLink, Check } from "lucide-react";
import { triggerDonationConfetti } from "@/lib/confetti";

interface DealConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  couponCode?: string | null;
  trackingUrl?: string | null;
  companyName: string;
  cashAllotment: number;
}

export const DealConfirmationModal = ({
  open,
  onClose,
  couponCode,
  trackingUrl,
  companyName,
  cashAllotment,
}: DealConfirmationModalProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      triggerDonationConfetti();
      if (couponCode) {
        navigator.clipboard.writeText(couponCode).catch(() => {});
      }
    }
  }, [open, couponCode]);

  const handleCopy = () => {
    if (!couponCode) return;
    navigator.clipboard.writeText(couponCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToStore = () => {
    if (trackingUrl) {
      window.open(trackingUrl, "_blank");
    }
  };

  const steps = couponCode
    ? [
        "Use the code at checkout",
        "Complete your purchase",
        "Cashback credited automatically",
      ]
    : [
        "Shop through the link below",
        "Complete your purchase",
        "Cashback credited automatically",
      ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm text-center gap-5">
        <DialogHeader className="items-center gap-2">
          <CheckCircle2 className="h-12 w-12 text-primary" />
          <DialogTitle className="text-xl">Deal Activated!</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Your cashback of up to <span className="font-semibold text-primary">₹{cashAllotment}</span> from {companyName} is ready.
          </p>
        </DialogHeader>

        {couponCode && (
          <button
            onClick={handleCopy}
            className="mx-auto flex items-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-5 py-3 font-mono text-lg font-bold tracking-wider text-primary transition hover:border-primary/60"
          >
            {couponCode}
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        )}

        <ol className="mx-auto max-w-[240px] space-y-2 text-left text-sm text-muted-foreground">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2">
          {trackingUrl && (
            <Button onClick={handleGoToStore} className="w-full">
              Go to Store <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Stay Here
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

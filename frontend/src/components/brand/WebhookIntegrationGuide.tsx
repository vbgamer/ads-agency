import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WebhookIntegrationGuideProps {
  webhookUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookIntegrationGuide({
  webhookUrl,
  open,
  onOpenChange,
}: WebhookIntegrationGuideProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Integration Guide</DialogTitle>
          <DialogDescription>
            What you need to do:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                1
              </span>
              <span className="font-medium">Copy this webhook URL</span>
            </div>
            <div className="ml-8 flex items-center gap-2">
              <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2">
                <code className="text-xs text-muted-foreground break-all">
                  {webhookUrl}
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                2
              </span>
              <span className="font-medium">Paste in your tracking partner</span>
            </div>
            <p className="ml-8 text-sm text-muted-foreground">
              Add the URL to your partner's <span className="font-medium text-foreground">"Postback URL"</span> or{" "}
              <span className="font-medium text-foreground">"Callback URL"</span> field.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                3
              </span>
              <span className="font-medium">Map the tracking parameter</span>
            </div>
            <div className="ml-8 space-y-2 text-sm text-muted-foreground">
              <p>
                When users click your campaign, they land on your site with{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">?ref=trk_xxx</code>
              </p>
              <p>Configure your partner to send this back:</p>
              <div className="rounded-md border bg-muted/50 px-3 py-2">
                <code className="text-xs font-mono">
                  {'{ "tracking_id": "trk_xxx" }'}
                </code>
              </div>
            </div>
          </div>

          {/* Reassurance */}
          <p className="text-sm text-muted-foreground border-t pt-4">
            That's it! Conversions will be tracked automatically.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

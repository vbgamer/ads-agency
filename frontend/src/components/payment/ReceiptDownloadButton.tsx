import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePaymentReceipt, PaymentReceiptData } from "@/lib/generatePaymentReceipt";
import { cn } from "@/lib/utils";

interface ReceiptDownloadButtonProps {
  receiptData: PaymentReceiptData;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function ReceiptDownloadButton({
  receiptData,
  variant = "ghost",
  size = "icon",
  showLabel = false,
  className,
}: ReceiptDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 100));
      generatePaymentReceipt(receiptData);
    } finally {
      setIsGenerating(false);
    }
  };

  if (size === "icon" && !showLabel) {
    return (
      <Button
        variant={variant}
        size="icon"
        className={cn("h-8 w-8", className)}
        onClick={handleDownload}
        disabled={isGenerating}
        title="Download Receipt"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {showLabel && "Receipt"}
    </Button>
  );
}

import { Calendar, Tag, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface CampaignDetailsProps {
  category: string;
  endDate: string;
  companyName: string;
  companyLogo: string;
  code: string | null;
  description: string | null;
}

export const CampaignDetails = ({
  category,
  endDate,
  companyName,
  companyLogo,
  code,
  description,
}: CampaignDetailsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Coupon code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <div className="space-y-5">
      {/* Info chips */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-sm">
          <Tag className="h-3.5 w-3.5" />
          <span className="capitalize">{category || "General"}</span>
        </Badge>
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-sm">
          <Calendar className="h-3.5 w-3.5" />
          Valid until{" "}
          {new Date(endDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Badge>
      </div>

      {/* Company strip */}
      <div className="flex items-center gap-3">
        <img
          src={companyLogo}
          alt={companyName}
          className="h-10 w-10 rounded-full object-contain bg-secondary p-1"
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${companyName}&background=10b981&color=fff`;
          }}
        />
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Company</p>
          <p className="font-semibold text-foreground text-sm">{companyName}</p>
          <p className="text-xs text-muted-foreground capitalize">{category || "General"}</p>
        </div>
      </div>

      {/* Coupon code */}
      {code && (
        <button
          onClick={handleCopy}
          className="w-full p-4 border-2 border-dashed border-primary/40 rounded-xl text-center hover:bg-primary/5 transition-colors group"
        >
          <p className="text-xs text-muted-foreground mb-1">Use Code</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-mono font-bold text-primary tracking-wider">
              {code}
            </span>
            {copied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>
        </button>
      )}

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description || "Enjoy exclusive cashback on this limited-time offer."}
      </p>
    </div>
  );
};


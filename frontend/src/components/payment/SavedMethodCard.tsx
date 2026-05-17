import { CreditCard, Smartphone, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SavedPaymentMethod } from "@/hooks/useSavedPaymentMethods";

interface SavedMethodCardProps {
  method: SavedPaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  disabled?: boolean;
}

export function SavedMethodCard({
  method,
  isSelected,
  onSelect,
  onDelete,
  onSetDefault,
  disabled,
}: SavedMethodCardProps) {
  const isCard = method.method_type === "card";

  return (
    <div
      onClick={disabled ? undefined : onSelect}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border p-3 transition-all",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:border-primary/50 hover:bg-accent/50",
        isSelected && "border-primary bg-primary/5 ring-1 ring-primary"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          isCard ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"
        )}
      >
        {isCard ? <CreditCard className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{method.display_name}</span>
          {method.is_default && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              <Star className="h-3 w-3 mr-0.5 fill-current" />
              Default
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isCard ? (
            <>
              {method.card_brand} • Expires {method.card_expiry}
            </>
          ) : (
            "UPI ID"
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!method.is_default && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault();
            }}
            title="Set as default"
          >
            <Star className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
      )}
    </div>
  );
}

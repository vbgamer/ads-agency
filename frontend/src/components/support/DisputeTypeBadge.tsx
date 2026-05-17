import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DisputeType } from "@/hooks/useCashbackDisputes";

interface DisputeTypeBadgeProps {
  type: DisputeType;
  className?: string;
}

const typeConfig: Record<DisputeType, { label: string; className: string }> = {
  missing_cashback: {
    label: "Missing Cashback",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
  },
  incorrect_amount: {
    label: "Incorrect Amount",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
  },
  delayed_cashback: {
    label: "Delayed",
    className: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  rejected_cashback: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400",
  },
};

export function DisputeTypeBadge({ type, className }: DisputeTypeBadgeProps) {
  const config = typeConfig[type];

  return (
    <Badge variant="outline" className={cn(config.className, "font-medium", className)}>
      {config.label}
    </Badge>
  );
}

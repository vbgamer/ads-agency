import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DisputeStatus } from "@/hooks/useCashbackDisputes";

interface DisputeStatusBadgeProps {
  status: DisputeStatus;
  className?: string;
}

const statusConfig: Record<DisputeStatus, { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  },
  under_review: {
    label: "Under Review",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function DisputeStatusBadge({ status, className }: DisputeStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn(config.className, "font-medium", className)}>
      {config.label}
    </Badge>
  );
}

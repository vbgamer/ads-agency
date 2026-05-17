import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Wallet, 
  User, 
  Bug, 
  CreditCard, 
  HelpCircle 
} from "lucide-react";
import type { TicketCategory } from "@/hooks/useSupportTickets";

interface TicketCategoryBadgeProps {
  category: TicketCategory;
  className?: string;
  showIcon?: boolean;
}

const categoryConfig: Record<TicketCategory, { 
  label: string; 
  icon: typeof Wallet;
  className: string;
}> = {
  cashback_issue: {
    label: "Cashback",
    icon: Wallet,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  account_problem: {
    label: "Account",
    icon: User,
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  technical_bug: {
    label: "Technical",
    icon: Bug,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  payment_issue: {
    label: "Payment",
    icon: CreditCard,
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  general_inquiry: {
    label: "General",
    icon: HelpCircle,
    className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  },
};

export function TicketCategoryBadge({ category, className, showIcon = true }: TicketCategoryBadgeProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, "font-medium gap-1", className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

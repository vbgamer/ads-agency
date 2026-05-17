import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CashbackCardProps {
  cashAllotment: number;
  isPremium: boolean;
  isUserLoggedIn: boolean;
}

export const CashbackCard = ({ cashAllotment, isPremium, isUserLoggedIn }: CashbackCardProps) => {
  const displayAmount = isUserLoggedIn
    ? isPremium
      ? cashAllotment
      : Math.round(cashAllotment * 0.7)
    : cashAllotment;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className={cn(
        "relative -mt-12 mx-4 md:mx-auto md:max-w-2xl z-10 rounded-2xl p-5 shadow-xl border",
        isPremium
          ? "bg-gradient-to-r from-yellow-500/10 via-yellow-400/5 to-background border-yellow-500/30 premium-card-highlight"
          : "bg-background border-border"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {isPremium ? "Full Cashback" : "Your Cashback"}
          </p>
          {isPremium && (
            <div className="flex items-center gap-1 mt-0.5">
              <Crown className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Premium reward</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <span className={cn(
            "text-3xl font-bold",
            isPremium ? "text-gradient-gold" : "text-primary"
          )}>
            {isUserLoggedIn ? `₹${displayAmount}` : `Up to ₹${displayAmount}`}
          </span>
          {isUserLoggedIn && !isPremium && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Premium gets ₹{cashAllotment}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

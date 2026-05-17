import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PremiumUpgradeBannerProps {
  cashAllotment: number;
  className?: string;
}

export function PremiumUpgradeBanner({ cashAllotment, className }: PremiumUpgradeBannerProps) {
  const navigate = useNavigate();
  // Standard users get 70%, premium get 100%
  const standardAmount = Math.round(cashAllotment * 0.7);
  const premiumAmount = cashAllotment;
  const extraAmount = premiumAmount - standardAmount;
  
  // Respect reduced motion preference
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent p-5 mt-4",
        className
      )}
    >
      {/* Sparkle decorations */}
      <div className="absolute top-2 right-3 text-yellow-500/60 text-xs" aria-hidden="true">✦</div>
      <div className="absolute bottom-3 left-4 text-yellow-500/40 text-xs" aria-hidden="true">✦</div>
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Crown className="h-5 w-5 text-yellow-500" aria-hidden="true" />
        <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
          Unlock More Cashback
        </span>
      </div>
      
      {/* Savings highlight */}
      <p className="text-foreground font-semibold mb-4">
        You could earn{" "}
        <span className="text-gradient-gold font-bold">₹{extraAmount} extra</span>
        {" "}on this deal!
      </p>
      
      {/* Comparison */}
      <div className="flex items-center gap-3 p-3 bg-background/60 rounded-lg mb-4">
        <div className="text-center flex-1">
          <p className="text-xs text-muted-foreground mb-1">Standard</p>
          <p className="text-lg font-bold text-foreground">₹{standardAmount}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-yellow-500 flex-shrink-0 premium-upgrade-arrow" aria-hidden="true" />
        <div className="text-center flex-1">
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1 font-medium">With Premium</p>
          <p className="text-lg font-bold text-gradient-gold">₹{premiumAmount}</p>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4">
        Premium members get the <span className="text-yellow-600 dark:text-yellow-400 font-medium">full 100% cashback</span> on every deal
      </p>
      
      {/* CTA Button */}
      <Button 
        onClick={() => navigate('/subscription')}
        className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold"
      >
        <Crown className="h-4 w-4 mr-2" />
        Upgrade to Premium
      </Button>
      
      {/* Pricing note */}
      <p className="text-xs text-muted-foreground text-center mt-3">
        Plans start at just ₹199/month
      </p>
    </motion.div>
  );
}

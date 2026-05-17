import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, ArrowRight } from "lucide-react";

interface PremiumUpgradePromptProps {
  currentAmount: number;
  premiumAmount: number;
}

export const PremiumUpgradePrompt = forwardRef<HTMLDivElement, PremiumUpgradePromptProps>(
  ({ currentAmount, premiumAmount }, ref) => {
    const navigate = useNavigate();
    const extraAmount = premiumAmount - currentAmount;
    
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigate('/subscription');
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        navigate('/subscription');
      }
    };
    
    return (
      <div 
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="w-full mt-3 p-2 rounded-lg border border-yellow-500/30 
                   bg-gradient-to-r from-yellow-500/10 to-amber-500/5
                   hover:from-yellow-500/20 hover:to-amber-500/10
                   transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" aria-hidden="true" />
            <span className="text-sm">
              Earn <span className="font-bold text-yellow-600 dark:text-yellow-400">₹{extraAmount} more</span> with Premium
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-yellow-500 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </div>
      </div>
    );
  }
);

PremiumUpgradePrompt.displayName = "PremiumUpgradePrompt";

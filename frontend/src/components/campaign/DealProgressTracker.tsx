import { motion } from "framer-motion";
import { MousePointerClick, ShoppingBag, CreditCard, Clock, Wallet, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface DealProgressTrackerProps {
  status: 'none' | 'clicked' | 'converted' | 'verified';
  hasVisitedStore?: boolean;
  className?: string;
}

const steps = [
  { 
    key: 'activated', 
    label: 'Reward Activated', 
    icon: MousePointerClick,
    description: 'Deal activated'
  },
  { 
    key: 'shopping', 
    label: 'Shopping', 
    icon: ShoppingBag,
    description: 'Visit the store'
  },
  { 
    key: 'purchased', 
    label: 'Purchased', 
    icon: CreditCard,
    description: 'Complete purchase'
  },
  { 
    key: 'verifying', 
    label: 'Verifying', 
    icon: Clock,
    description: '7-30 day hold'
  },
  { 
    key: 'credited', 
    label: 'Credited', 
    icon: Wallet,
    description: 'Cashback received'
  },
];

const messages: Record<number, string> = {
  1: "Deal activated! Visit the store to start shopping.",
  2: "Shopping in progress. Complete your purchase to continue.",
  3: "Purchase detected! Verification in progress.",
  4: "Your cashback is being verified. This may take 7-30 days.",
  5: "Congratulations! Your cashback has been credited to your wallet.",
};

const getActiveStep = (status: string, hasVisitedStore: boolean): number => {
  switch (status) {
    case 'clicked':
      return hasVisitedStore ? 2 : 1;
    case 'converted':
      return 4;
    case 'verified':
      return 5;
    default:
      return 0;
  }
};

export const DealProgressTracker = ({ 
  status, 
  hasVisitedStore = false, 
  className 
}: DealProgressTrackerProps) => {
  const activeStep = getActiveStep(status, hasVisitedStore);

  if (activeStep === 0) return null;

  return (
    <Card variant="glass" className={cn("overflow-hidden", className)}>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
          Your Cashback Journey
        </h3>
        
        {/* Progress Steps */}
        <div className="relative">
          {/* Progress Line Background */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted mx-8" />
          
          {/* Active Progress Line */}
          <motion.div 
            className="absolute top-5 left-0 h-0.5 bg-primary mx-8"
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.min(((activeStep - 1) / (steps.length - 1)) * 100, 100)}%` 
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          
          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < activeStep;
              const isActive = stepNumber === activeStep;
              const isPending = stepNumber > activeStep;
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.key}
                  className="flex flex-col items-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                      isCompleted && "bg-primary text-primary-foreground",
                      isActive && "bg-primary/20 text-primary border-2 border-primary",
                      isPending && "bg-muted text-muted-foreground",
                      isActive && "animate-pulse"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium text-center max-w-16 leading-tight",
                      isCompleted && "text-primary",
                      isActive && "text-primary",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Status Message */}
        <motion.p
          key={activeStep}
          className="mt-6 text-sm text-muted-foreground text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {messages[activeStep]}
        </motion.p>
      </CardContent>
    </Card>
  );
};

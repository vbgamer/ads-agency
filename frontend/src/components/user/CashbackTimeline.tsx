import { motion } from "framer-motion";
import { MousePointerClick, ShoppingBag, Clock, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

interface CashbackTimelineProps {
  status: string;
  verificationStatus: string;
  holdUntil: string | null;
}

const steps = [
  { key: "click", label: "Click", icon: MousePointerClick },
  { key: "conv", label: "Conv", icon: ShoppingBag },
  { key: "hold", label: "Hold", icon: Clock },
  { key: "credited", label: "Credited", icon: Wallet },
];

function getActiveStep(status: string, verificationStatus: string): number {
  if (verificationStatus === "verified") return 4;
  if (verificationStatus === "pending") return 3;
  if (status === "converted") return 2;
  if (status === "clicked") return 1;
  return 0;
}

export function CashbackTimeline({ status, verificationStatus, holdUntil }: CashbackTimelineProps) {
  const activeStep = getActiveStep(status, verificationStatus);
  const isRejected = verificationStatus === "rejected";

  const daysRemaining = holdUntil
    ? Math.max(0, differenceInDays(new Date(holdUntil), new Date()))
    : null;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-muted" />

        {/* Active line */}
        {activeStep > 0 && !isRejected && (
          <motion.div
            className="absolute top-3.5 left-4 h-0.5 bg-primary"
            initial={{ width: 0 }}
            animate={{
              width: `calc(${((Math.min(activeStep, steps.length) - 1) / (steps.length - 1)) * 100}% - 32px)`,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}

        {steps.map((step, i) => {
          const stepNum = i + 1;
          const isCompleted = !isRejected && stepNum < activeStep;
          const isActive = !isRejected && stepNum === activeStep;
          const isPending = isRejected || stepNum > activeStep;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.key}
              className="relative z-10 flex flex-col items-center flex-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isActive && "bg-primary/20 border-2 border-primary text-primary",
                  isPending && "bg-muted text-muted-foreground",
                  isRejected && stepNum <= getActiveStep(status, "pending") && "bg-destructive/20 text-destructive"
                )}
              >
                {isRejected && stepNum === getActiveStep(status, "pending") ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] font-medium leading-tight text-center",
                  isCompleted && "text-primary",
                  isActive && "text-primary",
                  isPending && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {step.key === "hold" && isActive && daysRemaining !== null && (
                <span className="text-[9px] text-muted-foreground mt-0.5">
                  ~{daysRemaining}d left
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

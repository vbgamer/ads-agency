import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { WelcomeStep } from "./onboarding/WelcomeStep";
import { AddFundsStep } from "./onboarding/AddFundsStep";
import { CreateCampaignStep } from "./onboarding/CreateCampaignStep";
import { SuccessStep } from "./onboarding/SuccessStep";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BrandOnboardingProps {
  companyName: string;
  walletBalance: number;
  campaignCount: number;
  onComplete: () => void;
}

type OnboardingStep = "welcome" | "add-funds" | "create-campaign" | "success";

const steps = [
  { id: "welcome", label: "Welcome" },
  { id: "add-funds", label: "Add Funds" },
  { id: "create-campaign", label: "Create Campaign" },
  { id: "success", label: "Done" },
];

export function BrandOnboarding({
  companyName,
  walletBalance,
  campaignCount,
  onComplete,
}: BrandOnboardingProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [hasFundsAdded, setHasFundsAdded] = useState(walletBalance > 0);
  const [hasCampaignCreated, setHasCampaignCreated] = useState(campaignCount > 0);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const markOnboardingComplete = async () => {
    if (!user) return;
    try {
      await supabase
        .from("companies")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
    } catch (error) {
      console.error("Failed to mark onboarding complete:", error);
    }
  };

  const handleSkipAll = async () => {
    await markOnboardingComplete();
    onComplete();
  };

  const handleWelcomeContinue = () => {
    setCurrentStep("add-funds");
  };

  const handleFundsContinue = () => {
    setHasFundsAdded(true);
    setCurrentStep("create-campaign");
  };

  const handleFundsSkip = () => {
    setCurrentStep("create-campaign");
  };

  const handleCampaignComplete = () => {
    setHasCampaignCreated(true);
    setCurrentStep("success");
    toast.success("Campaign created successfully!");
  };

  const handleCampaignSkip = () => {
    setCurrentStep("success");
  };

  const handleGoToDashboard = async () => {
    await markOnboardingComplete();
    onComplete();
  };

  const handleCreateCampaign = () => {
    setCurrentStep("create-campaign");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = step.id === currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4 md:h-5 md:w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1 hidden md:block ${
                        isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 md:w-16 h-0.5 mx-1 md:mx-2 ${
                        index < currentStepIndex ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === "welcome" && (
              <WelcomeStep
                companyName={companyName}
                onContinue={handleWelcomeContinue}
                onSkip={handleSkipAll}
              />
            )}

            {currentStep === "add-funds" && (
              <AddFundsStep
                onContinue={handleFundsContinue}
                onSkip={handleFundsSkip}
              />
            )}

            {currentStep === "create-campaign" && (
              <CreateCampaignStep
                onComplete={handleCampaignComplete}
                onSkip={handleCampaignSkip}
              />
            )}

            {currentStep === "success" && (
              <SuccessStep
                hasFunds={hasFundsAdded}
                hasCampaign={hasCampaignCreated}
                onGoToDashboard={handleGoToDashboard}
                onCreateCampaign={handleCreateCampaign}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

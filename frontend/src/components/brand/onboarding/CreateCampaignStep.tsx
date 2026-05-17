import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignCreationForm } from "@/components/brand/CampaignCreationForm";

interface CreateCampaignStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function CreateCampaignStep({ onComplete, onSkip }: CreateCampaignStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Megaphone className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Create Your First Campaign
        </h2>
        <p className="text-muted-foreground">
          Design a compelling offer to attract customers and drive conversions.
        </p>
      </div>

      <CampaignCreationForm
        onComplete={onComplete}
        onCancel={onSkip}
      />

      <div className="text-center mt-4">
        <Button variant="ghost" onClick={onSkip}>
          Skip and create later
        </Button>
      </div>
    </motion.div>
  );
}

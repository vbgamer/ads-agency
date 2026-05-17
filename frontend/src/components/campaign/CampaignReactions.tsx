import { motion } from "framer-motion";
import { ThumbsUp, Heart, Meh, Frown } from "lucide-react";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Reaction = "impressed" | "relatable" | "decent" | "boring";

const reactions = [
  { key: "impressed" as const, label: "Impressed", icon: Heart, color: "text-red-500" },
  { key: "relatable" as const, label: "Relatable", icon: ThumbsUp, color: "text-green-500" },
  { key: "decent" as const, label: "Decent", icon: Meh, color: "text-yellow-500" },
  { key: "boring" as const, label: "Boring", icon: Frown, color: "text-muted-foreground" },
];

interface CampaignReactionsProps {
  selectedReaction: Reaction | null;
  toggleReaction: (reaction: Reaction) => void;
  isSaving: boolean;
  isUserLoggedIn: boolean;
}

export const CampaignReactions = ({
  selectedReaction,
  toggleReaction,
  isSaving,
  isUserLoggedIn,
}: CampaignReactionsProps) => {
  const navigate = useNavigate();

  const handleReaction = useCallback(
    (reaction: Reaction) => {
      if (!isUserLoggedIn) {
        toast.error("Please login to react to this campaign", {
          action: { label: "Login", onClick: () => navigate("/login") },
        });
        return;
      }
      toggleReaction(reaction);
    },
    [isUserLoggedIn, navigate, toggleReaction]
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">How do you feel about this deal?</h3>
      <div className="flex gap-2">
        {reactions.map(({ key, label, icon: Icon, color }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleReaction(key)}
            disabled={isSaving}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-colors ${
              selectedReaction === key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 hover:bg-secondary text-foreground"
            }`}
          >
            <Icon className={`h-5 w-5 ${selectedReaction === key ? "text-primary-foreground" : color}`} />
            {label}
          </motion.button>
        ))}
      </div>
      {selectedReaction && (
        <p className="text-xs text-muted-foreground text-center">Thanks for your feedback!</p>
      )}
    </div>
  );
};

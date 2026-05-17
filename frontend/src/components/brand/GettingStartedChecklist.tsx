import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, X, User, Wallet, Megaphone, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Company {
  bio?: string | null;
  logo_url?: string | null;
  category?: string | null;
  website?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  facebook?: string | null;
}

interface GettingStartedChecklistProps {
  company: Company | null;
  totalDeposited: number;
  campaignCount: number;
  totalConversions: number;
  onEditProfile: () => void;
  onAddFunds: () => void;
  onCreateCampaign: () => void;
  onViewCampaigns: () => void;
  onDismiss: () => void;
}

export function GettingStartedChecklist({
  company,
  totalDeposited,
  campaignCount,
  totalConversions,
  onEditProfile,
  onAddFunds,
  onCreateCampaign,
  onViewCampaigns,
  onDismiss,
}: GettingStartedChecklistProps) {
  // Calculate completion status for each item
  const hasSocialOrWebsite = !!(
    company?.website ||
    company?.instagram ||
    company?.twitter ||
    company?.linkedin ||
    company?.facebook
  );
  
  const isProfileComplete = !!(
    company?.bio &&
    company?.logo_url &&
    company?.category &&
    hasSocialOrWebsite
  );
  
  const hasFunds = totalDeposited > 0;
  const hasCampaigns = campaignCount > 0;
  const hasConversions = totalConversions > 0;

  const checklistItems = [
    {
      id: "profile",
      label: "Complete your profile",
      description: "Add bio, logo, category, and social links",
      completed: isProfileComplete,
      icon: User,
      action: onEditProfile,
      actionLabel: "Edit Profile",
    },
    {
      id: "funds",
      label: "Add funds to cashback pool",
      description: "Fund your wallet to start offering cashbacks",
      completed: hasFunds,
      icon: Wallet,
      action: onAddFunds,
      actionLabel: "Add Funds",
    },
    {
      id: "campaign",
      label: "Create your first campaign",
      description: "Launch a campaign to attract customers",
      completed: hasCampaigns,
      icon: Megaphone,
      action: onCreateCampaign,
      actionLabel: "Create Campaign",
    },
    {
      id: "conversion",
      label: "Get your first conversion",
      description: "A customer redeems your cashback offer",
      completed: hasConversions,
      icon: TrendingUp,
      action: onViewCampaigns,
      actionLabel: "View Campaigns",
    },
  ];

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const progressPercent = (completedCount / checklistItems.length) * 100;
  const allComplete = completedCount === checklistItems.length;

  if (allComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mb-8"
      >
        <Card variant="accent" className="relative overflow-hidden border-success/30 bg-success/5">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardContent className="flex items-center gap-4 py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                <Sparkles className="h-8 w-8 text-success" />
              </div>
            </motion.div>
            <div>
              <h3 className="font-display text-xl font-bold text-success">
                All set! You're ready to grow 🎉
              </h3>
              <p className="text-muted-foreground">
                You've completed all the setup steps. Now focus on running great campaigns!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card variant="default" className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground z-10"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Getting Started</CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete these steps to start growing your business
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {completedCount}/{checklistItems.length} Complete
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Checklist items */}
          <div className="space-y-3 pt-2">
            <AnimatePresence>
              {checklistItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    item.completed
                      ? "border-success/30 bg-success/5"
                      : "border-border bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={false}
                      animate={item.completed ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </motion.div>
                    <div>
                      <p
                        className={`font-medium ${
                          item.completed ? "text-success line-through" : ""
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {!item.completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={item.action}
                      className="shrink-0"
                    >
                      {item.actionLabel}
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

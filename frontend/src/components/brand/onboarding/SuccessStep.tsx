import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, LayoutDashboard, Megaphone, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SuccessStepProps {
  hasFunds: boolean;
  hasCampaign: boolean;
  onGoToDashboard: () => void;
  onCreateCampaign: () => void;
}

export function SuccessStep({ hasFunds, hasCampaign, onGoToDashboard, onCreateCampaign }: SuccessStepProps) {
  const completedItems = [
    { label: "Account created", completed: true },
    { label: "Funds added to cashback pool", completed: hasFunds },
    { label: "First campaign created", completed: hasCampaign },
  ];

  const quickActions = [
    {
      icon: LayoutDashboard,
      label: "View Dashboard",
      description: "See your analytics and manage campaigns",
      onClick: onGoToDashboard,
      primary: true,
    },
    ...(hasCampaign
      ? []
      : [
          {
            icon: Megaphone,
            label: "Create Campaign",
            description: "Launch your first cashback offer",
            onClick: onCreateCampaign,
            primary: false,
          },
        ]),
    {
      icon: UserCircle,
      label: "Complete Profile",
      description: "Add logo, bio, and social links",
      onClick: onGoToDashboard,
      primary: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center max-w-lg mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="relative mb-6"
      >
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center"
        >
          <span className="text-primary-foreground text-lg">🎉</span>
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-foreground mb-2"
      >
        You're All Set!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mb-6"
      >
        Your brand is ready to start attracting customers.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full mb-8"
      >
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-3 text-left">Setup Progress</h3>
          <div className="space-y-2">
            {completedItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    item.completed ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    item.completed ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="w-full space-y-3"
      >
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant={action.primary ? "default" : "outline"}
            size="lg"
            onClick={action.onClick}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-3">
              <action.icon className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">{action.label}</div>
                <div className="text-xs opacity-70">{action.description}</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ))}
      </motion.div>
    </motion.div>
  );
}

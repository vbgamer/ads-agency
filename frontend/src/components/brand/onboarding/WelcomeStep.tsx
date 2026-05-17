import { motion } from "framer-motion";
import { Sparkles, Users, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WelcomeStepProps {
  companyName: string;
  onContinue: () => void;
  onSkip: () => void;
}

const benefits = [
  {
    icon: Users,
    title: "Attract Customers",
    description: "Offer cashback rewards that drive real purchases and build loyalty.",
  },
  {
    icon: BarChart3,
    title: "Track Performance",
    description: "Monitor campaign analytics, conversions, and ROI in real-time.",
  },
  {
    icon: TrendingUp,
    title: "Grow Revenue",
    description: "Turn first-time buyers into repeat customers with smart incentives.",
  },
];

export function WelcomeStep({ companyName, onContinue, onSkip }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center text-center max-w-2xl mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6"
      >
        <Sparkles className="h-10 w-10 text-primary" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl md:text-4xl font-bold text-foreground mb-3"
      >
        Welcome, {companyName}!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground text-lg mb-8"
      >
        Let's set up your first cashback campaign in just a few minutes.
      </motion.p>

      <div className="grid md:grid-cols-3 gap-4 w-full mb-8">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            <Card className="p-6 h-full text-left hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Button size="lg" onClick={onContinue} className="px-8">
          Get Started
        </Button>
        <Button variant="ghost" size="lg" onClick={onSkip}>
          Skip for now
        </Button>
      </motion.div>
    </motion.div>
  );
}

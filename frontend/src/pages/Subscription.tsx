import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, ArrowRight, Sparkles, Shield, Zap, Gift, Ticket } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MockPaymentModal } from "@/components/payment/MockPaymentModal";
import { useProcessSubscriptionPayment, useSubscription } from "@/hooks/usePayment";
import { useAvailableDiscounts } from "@/hooks/useReferrals";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    price: 199,
    period: "month",
    savings: null,
    popular: false,
  },
  {
    id: "quarterly",
    name: "Quarterly",
    price: 499,
    period: "3 months",
    savings: "Save ₹98",
    popular: false,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 1499,
    period: "year",
    savings: "Save ₹889",
    popular: true,
  },
];

const features = [
  {
    icon: Zap,
    title: "Early Access to Deals",
    description: "Get first access to new deals before anyone else",
  },
  {
    icon: Sparkles,
    title: "40% More Cashback",
    description: "Get up to 40% more cashback on all premium brand offers",
  },
  {
    icon: Gift,
    title: "Exclusive Deals",
    description: "Access premium-only deals from top brands",
  },
  {
    icon: Shield,
    title: "Premium Support",
    description: "24/7 priority customer support for any issues",
  },
];

const benefits = [
  "Early access to deals",
  "40% more cashback",
  "Exclusive deals",
  "Premium support",
  "No minimum withdrawal limit",
  "Weekly cashback bonuses",
  "Birthday bonus rewards",
  "Referral bonus multiplier",
];

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: subscription } = useSubscription();
  const { data: availableDiscounts = 0 } = useAvailableDiscounts();
  const processPayment = useProcessSubscriptionPayment();

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);
  const discountAmount = availableDiscounts > 0 ? 50 : 0;
  const discountedPrice = selectedPlanData ? selectedPlanData.price - discountAmount : 0;

  const handleSubscribe = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (
    success: boolean,
    cardLastFour: string,
    errorMessage?: string
  ) => {
    if (success) {
      setShowPaymentModal(false);
      setIsActivating(true);
    }

    try {
      await processPayment.mutateAsync({
        planId: selectedPlan,
        amount: selectedPlanData?.price || 0,
        cardLastFour,
        success,
        errorMessage,
      });
    } finally {
      if (success) {
        setIsActivating(false);
      }
    }
  };

  const isAlreadyPremium = subscription?.status === "active";

  return (
    <MainLayout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <Badge variant="premium" className="mb-4">
            <Crown className="mr-1 h-3 w-3" />
            Premium Membership
          </Badge>
          <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">
            Unlock Maximum <span className="text-gradient-primary">Savings</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Join Premium and get up to 40% more cashback, exclusive deals, and
            premium support. Save ₹5000+ monthly on average!
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature, index) => (
            <Card key={index} variant="elevated">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mb-2 font-display font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          {/* Referral Discount Banner */}
          {availableDiscounts > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto mb-6 max-w-3xl"
            >
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                  <Ticket className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-amber-700 dark:text-amber-300">
                    You have {availableDiscounts} referral discount{availableDiscounts > 1 ? "s" : ""} available!
                  </p>
                  <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                    ₹50 off will be applied automatically to your next subscription
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => {
                const planDiscountedPrice = plan.price - discountAmount;
                return (
                  <Card
                    key={plan.id}
                    variant={selectedPlan === plan.id ? "accent" : "default"}
                    className={`relative cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? "border-2 border-primary shadow-glow"
                        : "hover:border-primary/30"
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <Badge
                        variant="premium"
                        className="absolute -top-3 left-1/2 -translate-x-1/2"
                      >
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="font-display text-xl">
                        {plan.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        {availableDiscounts > 0 && (
                          <span className="text-xl text-muted-foreground line-through mr-2">
                            ₹{plan.price}
                          </span>
                        )}
                        <span className="font-display text-5xl font-bold">
                          ₹{availableDiscounts > 0 ? planDiscountedPrice : plan.price}
                        </span>
                        <span className="text-muted-foreground">
                          /{plan.period}
                        </span>
                      </div>
                      {plan.savings && (
                        <Badge variant="success" className="mb-4">
                          {plan.savings}
                        </Badge>
                      )}
                      <div
                        className={`mx-auto h-6 w-6 rounded-full border-2 ${
                          selectedPlan === plan.id
                            ? "border-primary bg-primary"
                            : "border-border"
                        } flex items-center justify-center`}
                      >
                        {selectedPlan === plan.id && (
                          <Check className="h-4 w-4 text-primary-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Benefits List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <Card variant="accent" className="mx-auto max-w-3xl">
            <CardContent className="p-8">
              <h3 className="mb-6 text-center font-display text-2xl font-bold">
                Everything You Get
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          {isAlreadyPremium ? (
            <div className="text-center">
              <Badge variant="success" className="mb-4">
                <Check className="mr-1 h-3 w-3" />
                You're a Premium Member
              </Badge>
              <p className="text-sm text-muted-foreground">
                Your subscription is active until{" "}
                {subscription?.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          ) : (
            <>
              <Button
                variant="hero"
                size="xl"
                onClick={handleSubscribe}
                disabled={processPayment.isPending}
              >
                {processPayment.isPending ? (
                  "Processing..."
                ) : (
                  <>
                    Get Premium Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Cancel anytime. 7-day money-back guarantee.
              </p>
            </>
          )}
        </motion.div>

        <MockPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={discountedPrice}
          title="Subscribe to Premium"
          description={
            availableDiscounts > 0
              ? `${selectedPlanData?.name} Plan - ₹${selectedPlanData?.price} → ₹${discountedPrice}/${selectedPlanData?.period} (₹50 referral discount applied)`
              : `${selectedPlanData?.name} Plan - ₹${selectedPlanData?.price}/${selectedPlanData?.period}`
          }
          onPaymentComplete={handlePaymentComplete}
        />

        {/* Premium Activation Overlay */}
        <AnimatePresence>
          {isActivating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
              role="status"
              aria-live="polite"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                {/* Animated Crown Icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg"
                >
                  <Crown className="h-10 w-10 text-white" />
                </motion.div>
                
                {/* Title */}
                <h2 className="mb-2 font-display text-2xl font-bold">
                  Activating Premium
                </h2>
                
                {/* Description */}
                <p className="mb-6 text-muted-foreground">
                  Setting up your premium benefits...
                </p>
                
                {/* Loading Dots */}
                <div className="flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                      className="h-3 w-3 rounded-full bg-amber-500"
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}

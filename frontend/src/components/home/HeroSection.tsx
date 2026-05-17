import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Shield, Crown, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useHeroStats } from "@/hooks/useHeroStats";
import { cn, formatIndianCurrency, formatCount } from "@/lib/utils";

function FloatingSparkle({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute text-primary/30"
      style={{ left: x, top: y }}
      animate={{
        y: [0, -12, 0],
        opacity: [0.2, 0.7, 0.2],
        scale: [0.8, 1.2, 0.8],
      }}
      transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <Sparkles className={`h-${size} w-${size}`} style={{ width: size * 4, height: size * 4 }} />
    </motion.div>
  );
}

export function HeroSection() {
  const { profile, user } = useAuth();
  const isPremium = profile?.is_premium;
  const { data: stats, isLoading } = useHeroStats();

  const trustText = (stats?.totalUsers ?? 0) >= 1000 
    ? `Trusted by ${formatCount(stats?.totalUsers ?? 0)}+ smart shoppers`
    : "Join our growing community of smart shoppers";

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Dot pattern overlay */}
      <div className="hero-dot-pattern absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* Animated gradient blobs */}
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "absolute -left-40 -top-40 h-80 w-80 rounded-full blur-3xl",
          isPremium ? "bg-yellow-400/15" : "bg-primary/10"
        )}
      />
      <motion.div
        animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "absolute -right-40 top-20 h-96 w-96 rounded-full blur-3xl",
          isPremium ? "bg-emerald-400/10" : "bg-accent/10"
        )}
      />
      <motion.div
        animate={{ x: [0, 10, 0], y: [0, 10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 -bottom-20 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/8 blur-3xl"
      />

      {/* Floating sparkles */}
      <FloatingSparkle delay={0} x="10%" y="20%" size={4} />
      <FloatingSparkle delay={1.5} x="85%" y="15%" size={3} />
      <FloatingSparkle delay={3} x="75%" y="70%" size={3} />

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Premium Welcome Badge */}
          {isPremium && user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="hero-premium-badge-glow mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-yellow-400/5 to-yellow-500/10 px-4 py-1.5 text-sm font-semibold text-yellow-600 dark:text-yellow-400"
            >
              <Crown className="h-4 w-4" />
              <span>Welcome back, Premium Member</span>
              <Crown className="h-4 w-4" />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium",
              isPremium 
                ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" 
                : "border-primary/20 bg-primary/5 text-primary"
            )}
          >
            <Sparkles className="h-4 w-4" />
            <span>{isPremium ? "Enjoy 40% Extra Cashback on All Deals" : trustText}</span>
          </motion.div>

          {/* Decorative divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 font-display text-4xl font-bold leading-tight md:text-6xl lg:text-7xl"
          >
            {isPremium ? (
              <>
                Enjoy <span className="text-gradient-gold hero-text-glow-gold">Premium</span> Cashback on{" "}
                <span className="text-gradient-primary hero-text-glow-primary">Every Purchase</span>
              </>
            ) : (
              <>
                Earn Real Cash on{" "}
                <span className="text-gradient-primary hero-text-glow-primary">Every Purchase</span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            {isPremium 
              ? "As a Premium member, you get 40% extra cashback on all purchases. Shop at 500+ brands and maximize your savings!"
              : "Shop at 500+ brands, get up to 25% cashback, and withdraw real money to your bank account. It's that simple."
            }
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {isPremium ? (
              <>
                <Link to="/offers">
                  <Button variant="hero" size="xl" className="hero-btn-glow bg-gradient-premium-gold hover:opacity-90 group">
                    <Crown className="h-5 w-5 mr-1" />
                    Browse Exclusive Deals
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/user/dashboard">
                  <Button variant="hero-secondary" size="xl">
                    Your Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="hero" size="xl" className="hero-btn-glow group">
                    Start Earning Now
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/offers">
                  <Button variant="hero-secondary" size="xl">
                    Browse Offers
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 grid grid-cols-3 gap-3 md:gap-6 max-w-xl mx-auto"
          >
            {[
              { icon: TrendingUp, label: isPremium ? "40%" : formatIndianCurrency(stats?.cashbackPaid ?? 0), sublabel: isPremium ? "Extra Cashback" : "Cashback Paid" },
              { icon: Shield, label: (stats?.partnerBrands ?? 0) > 0 ? `${stats?.partnerBrands}+` : "0", sublabel: "Partner Brands" },
              { icon: Zap, label: String(stats?.activeDeals ?? 0), sublabel: "Active Deals" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-3 backdrop-blur-sm md:p-5 hero-stat-card",
                  isPremium 
                    ? "border-yellow-500/30 bg-gradient-to-br from-yellow-50/50 to-card/50 dark:from-yellow-900/10" 
                    : "border-border/50 bg-card/50"
                )}
              >
                <stat.icon className={cn("h-5 w-5 md:h-6 md:w-6", isPremium ? "text-yellow-500" : "text-primary")} />
                {isLoading ? (
                  <Skeleton className="h-7 w-16 md:h-9 md:w-24" />
                ) : (
                  <span className={cn(
                    "font-display text-xl font-bold md:text-2xl",
                    isPremium && "text-gradient-gold"
                  )}>
                    {stat.label}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground md:text-sm">
                  {stat.sublabel}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

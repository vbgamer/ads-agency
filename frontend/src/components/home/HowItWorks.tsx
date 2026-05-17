import { motion } from "framer-motion";
import { MousePointer, Gift, Wallet, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: MousePointer,
    title: "Click Through Us",
    description:
      "Browse brands and click on any offer to visit their website through our tracking link.",
  },
  {
    icon: Gift,
    title: "Shop & Checkout",
    description:
      "Complete your purchase as usual. We automatically track your transaction.",
  },
  {
    icon: Wallet,
    title: "Earn Cashback",
    description:
      "Your cashback gets credited within 48 hours. Withdraw to bank anytime!",
  },
];

export function HowItWorks() {
  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-2 font-display text-3xl font-bold md:text-4xl">
            How It Works
          </h2>
          <p className="text-muted-foreground">
            Earning cashback is as easy as 1-2-3
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-1/2 top-16 hidden h-0.5 w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative text-center"
              >
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
                  <step.icon className="h-8 w-8 text-primary-foreground" />
                  <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground shadow-accent">
                    {index + 1}
                  </span>
                </div>

                <h3 className="mb-2 font-display text-xl font-bold">
                  {step.title}
                </h3>
                <p className="mx-auto max-w-xs text-muted-foreground">
                  {step.description}
                </p>

                {index < steps.length - 1 && (
                  <ArrowRight className="absolute -right-4 top-8 hidden h-6 w-6 text-primary/30 md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

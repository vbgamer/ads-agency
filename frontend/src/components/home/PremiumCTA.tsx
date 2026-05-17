import { motion } from "framer-motion";
import { Crown, Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  "Early Access to Deals",
  "40% More Cashback",
  "Exclusive Deals",
  "Premium Support",
];

export function PremiumCTA() {
  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card
            variant="accent"
            className="relative overflow-hidden border-2 border-primary/20"
          >
            {/* Background decoration */}
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent/10 blur-3xl" />

            <CardContent className="relative p-8 md:p-12">
              <div className="grid items-center gap-8 lg:grid-cols-2">
                <div>
                  <Badge variant="premium" className="mb-4">
                    <Crown className="mr-1 h-3 w-3" />
                    Premium Plan
                  </Badge>
                  <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
                    Unlock Maximum <span className="text-gradient-primary">Savings</span>
                  </h2>
                  <p className="mb-6 text-lg text-muted-foreground">
                    Go premium and access exclusive deals with up to 40% more
                    cashback. Pay ₹199/month and save ₹5000+ easily.
                  </p>
                  <Link to="/subscription">
                    <Button variant="hero" size="lg">
                      Get Premium Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 rounded-lg bg-card/50 p-3 backdrop-blur-sm"
                    >
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

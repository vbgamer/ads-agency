import { motion } from "framer-motion";
import { ArrowRight, Verified } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brands } from "@/data/mockData";

export function FeaturedBrands() {
  const featuredBrands = brands.slice(0, 8);

  return (
    <section className="bg-secondary/30 py-12 md:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h2 className="mb-2 font-display text-3xl font-bold md:text-4xl">
              Popular Brands
            </h2>
            <p className="text-muted-foreground">
              Top brands with verified cashback rewards
            </p>
          </div>
          <Link to="/offers" className="hidden sm:block">
            <Button variant="ghost">
              All Offers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
          {featuredBrands.map((brand, index) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/brand/${brand.id}`}>
                <Card
                  variant="elevated"
                  className="group cursor-pointer overflow-hidden"
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="mb-4 flex justify-between">
                      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2">
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${brand.name}&background=10b981&color=fff`;
                          }}
                        />
                      </div>
                      {brand.isPremium && (
                        <Badge variant="premium" className="h-fit">
                          Premium
                        </Badge>
                      )}
                    </div>

                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="font-display font-bold">{brand.name}</h3>
                      {brand.isVerified && (
                        <Verified className="h-4 w-4 text-primary" />
                      )}
                    </div>

                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                      {brand.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <Badge variant="cashback">
                        Up to {brand.cashbackPercent}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {brand.totalOffers} offers
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/offers">
            <Button variant="outline">
              View All Offers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

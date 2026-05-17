import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { categories } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { useActiveCampaigns } from "@/hooks/useCampaigns";
import { useState } from "react";

const INITIAL_DISPLAY_COUNT = 8;

export function CategoriesSection() {
  const [showAll, setShowAll] = useState(false);
  const { campaigns: activeCampaigns } = useActiveCampaigns();

  // Filter categories to only show those with active offers/campaigns
  const categoriesWithOffers = useMemo(() => {
    const categoryCounts: Record<string, number> = {};

    // Count from active campaigns (from Supabase)
    activeCampaigns.forEach(campaign => {
      if (campaign.category) {
        const categoryId = campaign.category.toLowerCase();
        categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
      }
    });

    // Filter categories that have at least 1 offer
    return categories
      .filter(cat => categoryCounts[cat.id] > 0)
      .map(cat => ({
        ...cat,
        count: categoryCounts[cat.id] || 0
      }));
  }, [activeCampaigns]);

  const displayedCategories = showAll
    ? categoriesWithOffers
    : categoriesWithOffers.slice(0, INITIAL_DISPLAY_COUNT);

  const remainingCount = categoriesWithOffers.length - INITIAL_DISPLAY_COUNT;

  // Don't render section if no categories have offers
  if (categoriesWithOffers.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="mb-2 font-display text-3xl font-bold md:text-4xl">
            Shop by Category
          </h2>
          <p className="text-muted-foreground">
            Explore cashback offers across all categories
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          <AnimatePresence mode="popLayout">
            {displayedCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index < INITIAL_DISPLAY_COUNT ? index * 0.05 : (index - INITIAL_DISPLAY_COUNT) * 0.03 }}
              >
                <Link
                  to={`/offers?category=${category.id}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
                >
                  <span className="text-4xl transition-transform duration-300 group-hover:scale-110">
                    {category.icon}
                  </span>
                  <span className="text-center text-sm font-medium">
                    {category.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {category.count} {category.count === 1 ? 'deal' : 'deals'}
                  </span>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {categoriesWithOffers.length > INITIAL_DISPLAY_COUNT && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex justify-center"
          >
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="gap-2"
            >
              {showAll ? (
                <>
                  View Less
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  View More ({remainingCount} more)
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

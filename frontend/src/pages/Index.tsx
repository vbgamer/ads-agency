import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { TrendingDeals } from "@/components/home/TrendingDeals";
import { FeaturedBrands } from "@/components/home/FeaturedBrands";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PremiumCTA } from "@/components/home/PremiumCTA";
import { PullToRefresh } from "@/components/PullToRefresh";

const Index = () => {
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    // Invalidate and refetch any cached queries on the home page
    await queryClient.invalidateQueries();
  }, [queryClient]);

  return (
    <MainLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <HeroSection />
        <CategoriesSection />
        <TrendingDeals />
        <FeaturedBrands />
        <HowItWorks />
        <PremiumCTA />
      </PullToRefresh>
    </MainLayout>
  );
};

export default Index;

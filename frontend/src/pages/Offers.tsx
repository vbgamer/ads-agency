import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareButtons } from "@/components/ui/share-buttons";
import { categories as allCategories } from "@/data/mockData";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useActiveCampaigns } from "@/hooks/useCampaigns";
import { CampaignCardSkeleton } from "@/components/skeletons";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { PremiumUpgradePrompt } from "@/components/premium/PremiumUpgradePrompt";

export default function BrandsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { campaigns, isLoading, refetch } = useActiveCampaigns();
  const { user, profile } = useAuth();
  const isUserLoggedIn = !!user;
  const isPremium = profile?.is_premium;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Extract unique categories from active campaigns only
  const activeCategories = useMemo(() => {
    const uniqueCategories = [...new Set(
      campaigns
        .map(c => c.category)
        .filter(Boolean) as string[]
    )];
    
    // Map to category objects with icons from mockData
    return uniqueCategories.map(catId => {
      const categoryInfo = allCategories.find(c => c.id === catId);
      return {
        id: catId,
        name: categoryInfo?.name ?? catId,
        icon: categoryInfo?.icon ?? '📁',
        count: campaigns.filter(c => c.category === catId).length
      };
    });
  }, [campaigns]);

  // Filter campaigns by search and selected category
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;
    
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }
    
    return filtered;
  }, [campaigns, searchQuery, selectedCategory]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-8 md:py-12 skeleton-shimmer skeleton-shimmer-primary">
          <div className="skeleton-accent-bar skeleton-accent-bar-primary mb-6" />
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <CampaignCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container py-8 md:py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="mb-2 font-display text-3xl font-bold md:text-4xl">
              Active Campaigns
            </h1>
            <p className="text-muted-foreground">
              Discover deals and earn cashback on every purchase
            </p>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex flex-col gap-4 sm:flex-row"
          >
            <div className={cn(
              "relative flex-1",
              isPremium && "premium-input-wrapper"
            )}>
              <Search className={cn(
                "absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2",
                isPremium ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"
              )} />
              <Input
                placeholder="Search campaigns or brands..."
                className={cn(
                  "pl-10",
                  isPremium && "border-yellow-500/30 focus:border-yellow-500/50"
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className={cn(
              "flex items-center gap-2",
              isPremium && "border-yellow-500/30 hover:border-yellow-500/50"
            )}>
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </motion.div>

          {/* Categories - Only show categories with active campaigns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex flex-wrap gap-2"
          >
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All ({campaigns.length})
            </Button>
            {activeCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.icon} {category.name} ({category.count})
              </Button>
            ))}
          </motion.div>

          {/* Campaigns Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {filteredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/campaign/${campaign.id}`}>
                  <Card
                    variant="elevated"
                    className={cn(
                      "group cursor-pointer overflow-hidden",
                      isPremium && "premium-card-highlight"
                    )}
                  >
                    {/* Campaign image */}
                    {campaign.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={campaign.image_url}
                          alt={campaign.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    <CardContent className="p-4 md:p-6">
                      {/* Company info */}
                      <div className="mb-3 flex items-center gap-2">
                        <img
                          src={campaign.company?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(campaign.company?.name || 'Brand')}&background=10b981&color=fff`}
                          alt={campaign.company?.name}
                          className="h-8 w-8 rounded-full object-cover border border-border"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(campaign.company?.name || 'Brand')}&background=10b981&color=fff`;
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {campaign.company?.name}
                        </span>
                      </div>

                      {/* Campaign title */}
                      <h3 className="mb-2 font-display font-bold line-clamp-2">
                        {campaign.title}
                      </h3>

                      {/* Description */}
                      {campaign.description && (
                        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                          {campaign.description}
                        </p>
                      )}

                      {/* Cashback badge and share */}
                      <div className="flex items-center justify-between">
                        <Badge variant="cashback">
                          {isUserLoggedIn ? (
                            isPremium 
                              ? `₹${campaign.cash_allotment} Cash` 
                              : `₹${Math.round(campaign.cash_allotment * 0.7)} Cash`
                          ) : (
                            `Up to ₹${campaign.cash_allotment}`
                          )}
                        </Badge>
                        <ShareButtons
                          url={`${window.location.origin}/campaign/${campaign.id}`}
                          title={campaign.title}
                          description={`Get ₹${campaign.cash_allotment} cashback from ${campaign.company?.name}`}
                          size="icon"
                        />
                      </div>

                      {/* Premium upgrade prompt for non-premium logged-in users */}
                      {isUserLoggedIn && !isPremium && (
                        <PremiumUpgradePrompt
                          currentAmount={Math.round(campaign.cash_allotment * 0.7)}
                          premiumAmount={campaign.cash_allotment}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {campaigns.length === 0 
                  ? "No active campaigns available at the moment"
                  : "No campaigns found matching your criteria"
                }
              </p>
            </div>
          )}
        </div>
      </PullToRefresh>
    </MainLayout>
  );
}

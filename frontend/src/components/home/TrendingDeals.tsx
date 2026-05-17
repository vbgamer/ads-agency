import { motion } from "framer-motion";
import { ArrowRight, Star, Lock, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/ui/share-buttons";
import { PremiumUpgradePrompt } from "@/components/premium/PremiumUpgradePrompt";
import { offers } from "@/data/mockData";
import { useActiveCampaigns } from "@/hooks/useCampaigns";
import { useAuth } from "@/hooks/useAuth";

export function TrendingDeals() {
  const { campaigns, isLoading } = useActiveCampaigns();
  const { user, profile } = useAuth();
  const isUserLoggedIn = !!user;
  const isPremium = profile?.is_premium;
  const navigate = useNavigate();

  // Combine active campaigns with mock offers for display
  const trendingOffers = offers.slice(0, Math.max(0, 6 - campaigns.length));

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h2 className="mb-2 font-display text-3xl font-bold md:text-4xl">
              Trending Deals
            </h2>
            <p className="text-muted-foreground">
              Handpicked offers with highest cashback
            </p>
          </div>
          <Link to="/offers" className="hidden sm:block">
            <Button variant="ghost">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {campaigns.length === 0 && trendingOffers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Star className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 font-display text-xl font-bold">No Active Deals Yet</h3>
            <p className="max-w-md text-muted-foreground">
              Check back soon for exciting cashback offers from our partner brands!
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Active Campaigns from Companies */}
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="deal" className="group overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative p-6">
                      <Badge variant="success" className="absolute right-4 top-4">
                        Live
                      </Badge>

                      <div className="mb-4 flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2">
                          <img
                            src={campaign.company?.logo_url || `https://ui-avatars.com/api/?name=${campaign.company?.name}&background=10b981&color=fff`}
                            alt={campaign.company?.name || 'Company'}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${campaign.company?.name}&background=10b981&color=fff`;
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-display font-bold">
                            {campaign.company?.name || 'Company'}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Ends {new Date(campaign.end_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <h4 className="mb-2 font-semibold leading-tight">
                        {campaign.title}
                      </h4>
                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {campaign.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <Badge variant="cashback" className="text-base">
                          {isUserLoggedIn ? (
                            isPremium 
                              ? `₹${campaign.cash_allotment} Cash` 
                              : `₹${Math.round(campaign.cash_allotment * 0.7)} Cash`
                          ) : (
                            `Up to ₹${campaign.cash_allotment}`
                          )}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <ShareButtons
                            url={`${window.location.origin}/campaign/${campaign.id}`}
                            title={`${campaign.title} - ${campaign.company?.name}`}
                            description={campaign.description || `Get ₹${campaign.cash_allotment} cashback!`}
                            size="icon"
                          />
                          {isUserLoggedIn ? (
                            <Button size="sm" onClick={() => navigate(`/campaign/${campaign.id}`)}>
                              Get Deal
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled className="opacity-60">
                              <Lock className="mr-1 h-3 w-3" />
                              Login to Get Deal
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Premium upgrade prompt for non-premium logged-in users */}
                      {isUserLoggedIn && !isPremium && (
                        <PremiumUpgradePrompt
                          currentAmount={Math.round(campaign.cash_allotment * 0.7)}
                          premiumAmount={campaign.cash_allotment}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Mock Offers (fallback) */}
            {trendingOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (campaigns.length + index) * 0.1 }}
              >
                <Card variant="deal" className="group overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative p-6">
                      {offer.isPremium && (
                        <Badge variant="premium" className="absolute right-4 top-4">
                          <Lock className="mr-1 h-3 w-3" />
                          Premium
                        </Badge>
                      )}

                      <div className="mb-4 flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2">
                          <img
                            src={offer.brandLogo}
                            alt={offer.brandName}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${offer.brandName}&background=10b981&color=fff`;
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-display font-bold">{offer.brandName}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="h-3 w-3 fill-warning text-warning" />
                            <span>4.8</span>
                          </div>
                        </div>
                      </div>

                      <h4 className="mb-2 font-semibold leading-tight">{offer.title}</h4>
                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {offer.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <Badge variant="cashback" className="text-base">
                          {offer.cashbackPercent}% Cashback
                        </Badge>
                        <div className="flex items-center gap-1">
                          <ShareButtons
                            url={`${window.location.origin}/offers/${offer.id}`}
                            title={`${offer.title} - ${offer.brandName}`}
                            description={`Get ${offer.cashbackPercent}% cashback!`}
                            size="icon"
                          />
                          {isUserLoggedIn ? (
                            <Button size="sm" onClick={() => navigate(`/offers/${offer.id}`)}>
                              Get Deal
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled className="opacity-60">
                              <Lock className="mr-1 h-3 w-3" />
                              Login to Get Deal
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link to="/offers">
            <Button variant="outline">
              View All Deals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

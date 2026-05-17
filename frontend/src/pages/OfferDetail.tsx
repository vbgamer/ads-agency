import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Tag, ArrowLeft, ThumbsUp, Heart, Meh, Frown } from "lucide-react";
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { offers, brands } from "@/data/mockData";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Reaction = "impressed" | "relatable" | "decent" | "boring" | null;

const OfferDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedReaction, setSelectedReaction] = useState<Reaction>(null);
  const { user } = useAuth();
  const isUserLoggedIn = !!user;

  const offer = offers.find((o) => o.id === id);
  const brand = offer ? brands.find((b) => b.id === offer.brandId) : null;

  if (!offer) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Offer not found</h1>
          <Link to="/offers" className="text-primary hover:underline mt-4 inline-block">
            Browse all offers
          </Link>
        </div>
      </MainLayout>
    );
  }

  const reactions = [
    { key: "impressed" as const, label: "Impressed", icon: Heart, color: "text-red-500" },
    { key: "relatable" as const, label: "Relatable", icon: ThumbsUp, color: "text-green-500" },
    { key: "decent" as const, label: "Decent", icon: Meh, color: "text-yellow-500" },
    { key: "boring" as const, label: "Boring", icon: Frown, color: "text-muted-foreground" },
  ];

  const handleReaction = (reaction: Reaction) => {
    setSelectedReaction(selectedReaction === reaction ? null : reaction);
  };

  const handleActivateCashback = () => {
    if (!isUserLoggedIn) {
      toast.error("Please login to activate this offer", {
        action: {
          label: "Login",
          onClick: () => navigate("/login"),
        },
      });
      return;
    }
    toast.success("Cashback activated! Shop now to earn rewards.");
  };

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Offer Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {offer.title}
          </h1>
          <p className="text-muted-foreground">
            by <span className="text-primary font-medium">{offer.brandName}</span>
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Offer Image & Feedback */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Offer Image/Banner */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <img
                src={offer.brandLogo}
                alt={offer.brandName}
                className="h-24 w-24 object-contain"
              />
              {offer.isPremium && (
                <Badge className="absolute top-4 right-4 bg-gradient-accent">
                  Premium
                </Badge>
              )}
            </div>

            {/* Feedback Section */}
            <Card variant="glass">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  How do you feel about this deal?
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {reactions.map(({ key, label, icon: Icon, color }) => (
                    <Button
                      key={key}
                      variant={selectedReaction === key ? "default" : "outline"}
                      className={`flex flex-col items-center gap-2 h-auto py-4 ${
                        selectedReaction === key
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                      onClick={() => handleReaction(key)}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          selectedReaction === key ? "text-primary-foreground" : color
                        }`}
                      />
                      <span className="text-xs font-medium">{label}</span>
                    </Button>
                  ))}
                </div>
                {selectedReaction && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Thanks for your feedback!
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Campaign Details Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card variant="elevated" className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl">Campaign Details</CardTitle>
                <p className="text-muted-foreground">
                  Grab this limited-time offer now!
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Limited Time Badge */}
                <Badge variant="outline" className="border-primary text-primary">
                  Limited time offer
                </Badge>

                {/* Cashback */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-xl">
                  <span className="text-muted-foreground">Cashback</span>
                  <span className="text-2xl font-bold text-primary">
                    {offer.cashbackPercent}%
                  </span>
                </div>

                {/* Category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span>Category</span>
                  </div>
                  <span className="font-medium capitalize text-foreground">
                    {offer.category}
                  </span>
                </div>

                {/* Valid Until */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Offer Uptil</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {new Date(offer.validUntil).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Brand Info */}
                <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                  <img
                    src={brand?.logo || offer.brandLogo}
                    alt={offer.brandName}
                    className="h-12 w-12 rounded-full object-contain bg-background p-1"
                  />
                  <div>
                    <p className="font-medium text-foreground">{offer.brandName}</p>
                    <p className="text-sm text-muted-foreground">
                      {brand?.totalOffers || 0} offers available
                    </p>
                  </div>
                </div>

                {/* Coupon Code */}
                {offer.code && (
                  <div className="p-4 border border-dashed border-primary/50 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground mb-1">Use Code</p>
                    <p className="text-lg font-mono font-bold text-primary">
                      {offer.code}
                    </p>
                  </div>
                )}

                {/* Description */}
                <p className="text-muted-foreground text-sm">
                  {offer.description}
                </p>

                {/* Activate Button */}
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="w-full"
                  onClick={isUserLoggedIn ? handleActivateCashback : undefined}
                  disabled={!isUserLoggedIn}
                >
                  {isUserLoggedIn ? "Activate Cashback" : "Login to Activate"}
                </Button>
                {!isUserLoggedIn && (
                  <p className="text-center text-xs text-muted-foreground">
                    <Link to="/login" className="text-primary hover:underline">
                      Sign in
                    </Link>{" "}
                    to activate this cashback
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OfferDetail;

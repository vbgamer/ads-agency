import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Verified,
  Star,
  ExternalLink,
  ArrowRight,
  Lock,
  Copy,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/ui/share-buttons";
import { brands, offers } from "@/data/mockData";
import { toast } from "sonner";

export default function OfferListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const brand = brands.find((b) => b.id === id);
  const brandOffers = offers.filter((o) => o.brandId === id);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const userAuth = localStorage.getItem("userAuth");
      setIsUserLoggedIn(!!userAuth);
    };
    
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("userAuthChange", checkAuth);
    
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("userAuthChange", checkAuth);
    };
  }, []);

  if (!brand) {
    return (
      <MainLayout>
        <div className="container py-12 text-center">
          <h1 className="mb-4 font-display text-2xl font-bold">
            Brand not found
          </h1>
          <Link to="/offers">
            <Button>Back to Offers</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleActivate = () => {
    if (!isUserLoggedIn) {
      toast.error("Please log in to activate cashback", {
        description: "Create an account or sign in to access this feature.",
      });
      navigate("/login");
      return;
    }
    toast.success("Redirecting to " + brand.name + "...", {
      description: "Your cashback will be tracked automatically.",
    });
  };

  return (
    <MainLayout>
      <div className="container py-8 md:py-12">
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card variant="accent" className="overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-md">
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${brand.name}&background=10b981&color=fff&size=128`;
                      }}
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <h1 className="font-display text-3xl font-bold">
                        {brand.name}
                      </h1>
                      {brand.isVerified && (
                        <Verified className="h-6 w-6 text-primary" />
                      )}
                      {brand.isPremium && (
                        <Badge variant="premium" className="ml-2">
                          Premium Partner
                        </Badge>
                      )}
                    </div>
                    <p className="mb-3 text-muted-foreground">
                      {brand.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-medium">4.8</span>
                        <span className="text-sm text-muted-foreground">
                          (2.4k reviews)
                        </span>
                      </div>
                      <Badge variant="cashback" className="text-base">
                        Up to {brand.cashbackPercent}% Cashback
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                  <Button 
                    variant="hero" 
                    size="lg" 
                    onClick={isUserLoggedIn ? handleActivate : undefined}
                    disabled={!isUserLoggedIn}
                  >
                    {isUserLoggedIn ? "Activate Cashback" : "Login to Activate"}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                  {!isUserLoggedIn ? (
                    <p className="text-center text-xs text-muted-foreground">
                      <Link to="/login" className="text-primary hover:underline">
                        Sign in
                      </Link>{" "}
                      to activate cashback
                    </p>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">
                      {brand.totalOffers} active offers available
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Offers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="mb-6 font-display text-2xl font-bold">
            Available Offers
          </h2>

          {brandOffers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {brandOffers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <Card variant="deal" className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1 mr-2">
                          <h3 className="mb-2 font-display font-bold">
                            {offer.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {offer.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {offer.isPremium && (
                            <Badge variant="premium">
                              <Lock className="mr-1 h-3 w-3" />
                              Premium
                            </Badge>
                          )}
                          <ShareButtons
                            url={`${window.location.origin}/offers/${offer.id}`}
                            title={`${offer.title} - ${brand.name}`}
                            description={`Get ${offer.cashbackPercent}% cashback!`}
                            size="icon"
                          />
                        </div>
                      </div>

                      <div className="mb-4 flex items-center gap-4">
                        <Badge variant="cashback" className="text-base">
                          {offer.cashbackPercent}% Cashback
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Valid till{" "}
                          {new Date(offer.validUntil).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          {offer.code ? (
                            <>
                              <div className="flex flex-1 items-center justify-between rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-2">
                                <span className="font-mono font-bold tracking-wider">
                                  {offer.code}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyCode(offer.code!)}
                                >
                                  {copiedCode === offer.code ? (
                                    <Check className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <Button 
                                onClick={isUserLoggedIn ? handleActivate : undefined}
                                disabled={!isUserLoggedIn}
                              >
                                {isUserLoggedIn ? "Use Code" : "Login"}
                                <ArrowRight className="ml-1 h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button 
                              className="w-full" 
                              onClick={isUserLoggedIn ? handleActivate : undefined}
                              disabled={!isUserLoggedIn}
                            >
                              {isUserLoggedIn ? "Activate & Shop" : "Login to Activate"}
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {!isUserLoggedIn && (
                          <p className="text-xs text-muted-foreground">
                            <Link to="/login" className="text-primary hover:underline">
                              Sign in
                            </Link>{" "}
                            to use this offer
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card variant="outline" className="p-8 text-center">
              <p className="text-muted-foreground">
                No specific offers available. Activate cashback to get{" "}
                {brand.cashbackPercent}% on all purchases!
              </p>
              <Button 
                className="mt-4" 
                onClick={isUserLoggedIn ? handleActivate : undefined}
                disabled={!isUserLoggedIn}
              >
                {isUserLoggedIn ? "Activate Cashback" : "Login to Activate"}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              {!isUserLoggedIn && (
                <p className="mt-2 text-xs text-muted-foreground">
                  <Link to="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>{" "}
                  to activate cashback
                </p>
              )}
            </Card>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}

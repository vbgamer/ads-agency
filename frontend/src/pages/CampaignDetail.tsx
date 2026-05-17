import { useParams, Link, useNavigate } from "react-router-dom";
import { useCallback, useState } from "react";
import { CampaignDetailSkeleton } from "@/components/skeletons";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCampaignById } from "@/hooks/useCampaigns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { PullToRefresh } from "@/components/PullToRefresh";
import {
  useTrackView,
  useReaction,
  useGrabDeal,
  useHasGrabbedDeal,
} from "@/hooks/useCampaignInteractions";
import { PremiumUpgradeBanner } from "@/components/premium/PremiumUpgradeBanner";
import { DealProgressTracker } from "@/components/campaign/DealProgressTracker";
import { CampaignHero } from "@/components/campaign/CampaignHero";
import { CashbackCard } from "@/components/campaign/CashbackCard";
import { CampaignDetails } from "@/components/campaign/CampaignDetails";
import { CampaignReactions } from "@/components/campaign/CampaignReactions";
import { StickyActionBar } from "@/components/campaign/StickyActionBar";
import { DealConfirmationModal } from "@/components/campaign/DealConfirmationModal";

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const isUserLoggedIn = !!user;
  const isPremium = profile?.is_premium;

  const { campaign, isLoading, error, refetch } = useCampaignById(id || '');

  useTrackView(id || '');

  const { reaction: selectedReaction, toggleReaction, isSaving: reactionSaving } = useReaction(id || '');
  const { hasGrabbed, trackingId, trackingStatus, isLoading: dealLoading, setHasGrabbed, setTrackingId, setTrackingStatus } = useHasGrabbedDeal(id || '');
  const { grabDeal, isGrabbing } = useGrabDeal(id || '');

  // Build tracking URL from trackingId for returning users
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const [freshTrackingUrl, setFreshTrackingUrl] = useState<string | null>(null);
  const trackingUrl = freshTrackingUrl || (trackingId ? `${supabaseUrl}/functions/v1/track-redirect?ref=${trackingId}` : null);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [grabResult, setGrabResult] = useState<{ couponCode?: string; trackingUrl?: string } | null>(null);

  const isStateLoading = authLoading || dealLoading;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleGrabDeal = useCallback(async () => {
    if (!isUserLoggedIn) {
      toast.error("Please login to grab this deal", {
        action: { label: "Login", onClick: () => navigate("/login") },
      });
      return;
    }
    const result = await grabDeal();
    if (result.success) {
      setHasGrabbed(true);
      setTrackingStatus('clicked');
      if (result.trackingId) setTrackingId(result.trackingId);
      if (result.trackingUrl) setFreshTrackingUrl(result.trackingUrl);
      setGrabResult({ couponCode: result.couponCode, trackingUrl: result.trackingUrl });
      setShowConfirmation(true);
    }
  }, [isUserLoggedIn, grabDeal, navigate, setHasGrabbed, setTrackingStatus, setTrackingId]);

  if (isLoading) return <CampaignDetailSkeleton />;

  if (!campaign || error) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Campaign not found</h1>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">Browse all deals</Link>
        </div>
      </MainLayout>
    );
  }

  const isExpired = campaign.end_date < new Date().toISOString().split('T')[0] || campaign.status === 'expired';
  const companyName = campaign.company?.name || 'Company';
  const companyLogo = campaign.company?.logo_url || `https://ui-avatars.com/api/?name=${companyName}&background=10b981&color=fff`;

  return (
    <MainLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="pb-28 md:pb-8">
          {/* Hero */}
          <CampaignHero
            title={campaign.title}
            companyName={companyName}
            companyLogo={companyLogo}
            category={campaign.category || 'General'}
            imageUrl={campaign.image_url}
            videoUrl={campaign.video_url}
            coverUrl={campaign.company?.cover_url}
            adFormat={campaign.ad_format}
            isExpired={isExpired}
          />

          {/* Floating Cashback Card */}
          <CashbackCard
            cashAllotment={campaign.cash_allotment}
            isPremium={!!isPremium}
            isUserLoggedIn={isUserLoggedIn}
          />

          {/* Desktop action area */}
          <div className="hidden md:block max-w-2xl mx-auto px-4 mt-4">
            <StickyActionBar
              isStateLoading={isStateLoading}
              isExpired={isExpired}
              isUserLoggedIn={isUserLoggedIn}
              hasGrabbed={hasGrabbed}
              isGrabbing={isGrabbing}
              trackingStatus={trackingStatus}
              trackingUrl={trackingUrl}
              onGrabDeal={handleGrabDeal}
            />
          </div>

          {/* Content */}
          <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
            {/* Details */}
            <CampaignDetails
              category={campaign.category || 'General'}
              endDate={campaign.end_date}
              companyName={companyName}
              companyLogo={companyLogo}
              code={campaign.code}
              description={campaign.description}
            />

            {/* Progress Tracker */}
            {hasGrabbed && trackingStatus !== 'none' && (
              <DealProgressTracker
                status={trackingStatus as 'none' | 'clicked' | 'converted' | 'verified'}
                hasVisitedStore={hasGrabbed}
              />
            )}

            {/* Login prompt */}
            {!isUserLoggedIn && !isExpired && (
              <p className="text-center text-xs text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">Sign in</Link>{" "}to grab this deal
              </p>
            )}

            {/* Reactions */}
            <CampaignReactions
              selectedReaction={selectedReaction as any}
              toggleReaction={toggleReaction}
              isSaving={reactionSaving}
              isUserLoggedIn={isUserLoggedIn}
            />

            {/* Premium Banner */}
            {isUserLoggedIn && !isPremium && !isExpired && (
              <PremiumUpgradeBanner cashAllotment={campaign.cash_allotment} />
            )}
          </div>

          {/* Mobile sticky bar */}
          <div className="md:hidden">
            <StickyActionBar
              isStateLoading={isStateLoading}
              isExpired={isExpired}
              isUserLoggedIn={isUserLoggedIn}
              hasGrabbed={hasGrabbed}
              isGrabbing={isGrabbing}
              trackingStatus={trackingStatus}
              trackingUrl={trackingUrl}
              onGrabDeal={handleGrabDeal}
            />
          </div>
        </div>
      </PullToRefresh>

      <DealConfirmationModal
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        couponCode={grabResult?.couponCode}
        trackingUrl={grabResult?.trackingUrl || trackingUrl}
        companyName={companyName}
        cashAllotment={campaign.cash_allotment}
      />
    </MainLayout>
  );
};

export default CampaignDetail;


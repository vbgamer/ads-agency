import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  Share2,
  Gift,
  Users,
  Ticket,
  Crown,
  Loader2,
  MessageCircle,
  Twitter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useReferralCode, useReferralStats, useReferralList } from "@/hooks/useReferrals";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ReferralSectionProps {
  isPremium?: boolean;
}

export function ReferralSection({ isPremium = false }: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);
  const { data: referralCode, isLoading: codeLoading } = useReferralCode();
  const { data: stats, isLoading: statsLoading } = useReferralStats();
  const { data: referrals, isLoading: referralsLoading } = useReferralList();

  const referralLink = referralCode
    ? `${window.location.origin}/login?ref=${referralCode}`
    : "";

  const handleCopyCode = async () => {
    if (!referralCode) return;

    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast({
        title: "Code copied!",
        description: "Share this code with your friends.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link copied!",
        description: "Share this link with your friends.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "Join ADSSIMSIM",
      text: `Use my referral code ${referralCode} to sign up and get ₹50 bonus when you subscribe to Premium!`,
      url: referralLink,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `Hey! Join ADSSIMSIM and earn cashback on every purchase. Use my referral code ${referralCode} to get ₹50 bonus when you subscribe to Premium! ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(
      `Join @ADSSIMSIM and earn real cashback! Use my code ${referralCode} to get ₹50 bonus 🎁`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const isLoading = codeLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={cn("text-2xl font-bold", isPremium && "text-gradient-gold")}>
          Refer & Earn
        </h2>
        <p className="text-muted-foreground">
          Invite friends and earn ₹50 off your next Premium subscription
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className={cn("overflow-hidden", isPremium && "premium-card border-premium-gold")}>
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Referral Code
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Share this code with friends to earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Code Display */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-center">
                <span className="font-mono text-2xl font-bold tracking-widest text-primary">
                  {referralCode || "Loading..."}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="h-12 w-12"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleShare} className="flex-1 min-w-[140px]">
              <Share2 className="mr-2 h-4 w-4" />
              Share Link
            </Button>
            <Button
              variant="outline"
              onClick={handleWhatsAppShare}
              className="flex-1 min-w-[140px] border-green-500/30 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={handleTwitterShare}
              className="flex-1 min-w-[140px] border-sky-500/30 text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-950"
            >
              <Twitter className="mr-2 h-4 w-4" />
              Twitter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={cn(isPremium && "premium-card border-premium-gold")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Friends Referred</p>
                  <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={cn(isPremium && "premium-card border-premium-gold")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                  <Ticket className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Discounts Available</p>
                  <p className="text-2xl font-bold">{stats?.availableDiscounts || 0}</p>
                  {(stats?.availableDiscounts || 0) > 0 && (
                    <p className="text-xs text-green-600">
                      ₹{(stats?.availableDiscounts || 0) * 50} off next subscription
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={cn(isPremium && "premium-card border-premium-gold")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                  <Crown className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Converted</p>
                  <p className="text-2xl font-bold">{stats?.convertedReferrals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* How It Works */}
      <Card className={cn(isPremium && "premium-card border-premium-gold")}>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Share Your Code</p>
                <p className="text-sm text-muted-foreground">
                  Send your unique code to friends
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              <div>
                <p className="font-medium">They Subscribe</p>
                <p className="text-sm text-muted-foreground">
                  Friend signs up and gets Premium
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Both Earn Rewards</p>
                <p className="text-sm text-muted-foreground">
                  You get ₹50 off, they get ₹50 bonus
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      {referrals && referrals.length > 0 && (
        <Card className={cn(isPremium && "premium-card border-premium-gold")}>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Friend Invited</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(referral.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      referral.status === "rewarded"
                        ? "success"
                        : referral.status === "converted"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {referral.status === "rewarded"
                      ? "Rewarded"
                      : referral.status === "converted"
                      ? "Converted"
                      : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

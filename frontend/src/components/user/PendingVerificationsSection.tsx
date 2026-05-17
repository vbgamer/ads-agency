import { Clock, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePendingVerifications } from "@/hooks/useCampaignInteractions";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { CashbackTimeline } from "./CashbackTimeline";

interface PendingVerificationsSectionProps {
  isPremium?: boolean;
}

export function PendingVerificationsSection({ isPremium = false }: PendingVerificationsSectionProps) {
  const { pendingDeals, isLoading } = usePendingVerifications();

  const getStatusBadge = (status: string, verificationStatus: string) => {
    if (verificationStatus === 'verified') {
      return <Badge className="bg-green-500">Credited</Badge>;
    }
    if (verificationStatus === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    if (status === 'converted') {
      return <Badge className="bg-blue-500">Pending Verification</Badge>;
    }
    if (status === 'clicked') {
      return <Badge variant="secondary">Awaiting Conversion</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getEstimatedCreditTime = (holdUntil: string | null) => {
    if (!holdUntil) return null;
    const holdDate = new Date(holdUntil);
    const now = new Date();
    const daysRemaining = differenceInDays(holdDate, now);
    
    if (daysRemaining <= 0) return "Processing...";
    if (daysRemaining === 1) return "~1 day";
    return `~${daysRemaining} days`;
  };

  if (isLoading) {
    return (
      <Card className={cn(isPremium && "premium-card border-premium-gold")}>
        <CardHeader>
          <CardTitle className={cn(isPremium && "text-gradient-gold")}>Pending Deals</CardTitle>
          <CardDescription>Your deals awaiting verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingDeals.length === 0) {
    return (
      <Card className={cn(isPremium && "premium-card border-premium-gold")}>
        <CardHeader>
          <CardTitle className={cn(isPremium && "text-gradient-gold")}>Pending Deals</CardTitle>
          <CardDescription>Your deals awaiting verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending deals</p>
            <p className="text-sm mt-2">
              <Link to="/" className="text-primary hover:underline">
                Browse deals
              </Link>{" "}
              to get started!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(isPremium && "premium-card border-premium-gold")}>
      <CardHeader>
        <CardTitle className={cn(isPremium && "text-gradient-gold")}>Pending Deals</CardTitle>
        <CardDescription>Your deals awaiting verification</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingDeals.map((deal) => (
            <div
              key={deal.id}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-4",
                isPremium ? "bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10" : "bg-muted/50"
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{deal.campaignTitle}</h4>
                  {getStatusBadge(deal.status, deal.verificationStatus)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {deal.companyName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Activated {formatDistanceToNow(new Date(deal.createdAt), { addSuffix: true })}
                </p>
              </div>

              <CashbackTimeline
                status={deal.status}
                verificationStatus={deal.verificationStatus}
                holdUntil={deal.holdUntil}
              />
              
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-bold",
                    isPremium ? "text-gradient-gold" : "text-primary"
                  )}>
                    ₹{deal.amount}
                  </p>
                  {deal.verificationStatus === 'pending' && deal.holdUntil && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Est. credit: {getEstimatedCreditTime(deal.holdUntil)}
                    </p>
                  )}
                </div>
                
                {deal.status === 'clicked' && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3" />
                    Complete purchase to earn
                  </div>
                )}
                
                {deal.verificationStatus === 'verified' && (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Cashback credited
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

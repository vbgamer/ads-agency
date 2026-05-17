import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { CampaignCardSkeleton } from "./CampaignCardSkeleton";

export function CompanyHubSkeleton() {
  return (
    <MainLayout>
      <div className="container py-8 skeleton-shimmer skeleton-shimmer-primary">
        {/* Back Button */}
        <Skeleton className="h-4 w-32 mb-6" />

        {/* Company Header Card */}
        <Card className="overflow-hidden mb-8">
          {/* Cover Banner — themed shimmer */}
          <div className="relative h-32 md:h-48 w-full bg-muted overflow-hidden">
            <div className="absolute inset-0 skeleton-shimmer skeleton-shimmer-primary" />
          </div>
          
          {/* Company Info */}
          <div className="relative px-6 pb-6">
            {/* Logo — themed glow */}
            <div className="absolute -top-12 left-6">
              <div className="h-24 w-24 rounded-xl border-4 border-background bg-gradient-to-br from-red-500/10 to-fuchsia-500/10 skeleton-icon-pulse" />
            </div>
            
            <div className="pt-16">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full max-w-xl mt-4" />
              <Skeleton className="h-4 w-3/4 max-w-lg mt-2" />
            </div>
          </div>
        </Card>

        {/* Active Campaigns Section */}
        <div className="mb-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
          </div>
        </div>

        {/* Past Campaigns Section */}
        <div>
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

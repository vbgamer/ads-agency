import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCardSkeleton } from "./StatCardSkeleton";
import { CampaignCardSkeleton } from "./CampaignCardSkeleton";

export function BrandDashboardSkeleton() {
  return (
    <div className="flex min-h-screen bg-background skeleton-shimmer skeleton-shimmer-brand">
      {/* Top accent bar */}
      <div className="fixed top-0 left-0 right-0 z-50 skeleton-accent-bar skeleton-accent-bar-brand" />

      {/* Sidebar Skeleton */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card p-4">
        <div className="flex items-center gap-3 mb-8 p-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/25 to-cyan-500/25 skeleton-icon-pulse" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <nav className="space-y-2 skeleton-stagger">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </nav>
        <div className="mt-auto">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8">
        {/* Loading indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center skeleton-icon-pulse">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-blue-500/40 to-cyan-500/40" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <span className="skeleton-loading-label text-muted-foreground">Loading brand dashboard...</span>
              </div>
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 skeleton-stagger">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Campaign Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8 skeleton-stagger">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500/15 to-cyan-500/15 skeleton-icon-pulse" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Campaigns Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}

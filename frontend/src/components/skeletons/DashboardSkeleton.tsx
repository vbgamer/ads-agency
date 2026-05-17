import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCardSkeleton } from "./StatCardSkeleton";
import { TransactionSkeleton } from "./TransactionSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen bg-background skeleton-shimmer skeleton-shimmer-primary">
      {/* Top accent bar */}
      <div className="fixed top-0 left-0 right-0 z-50 skeleton-accent-bar skeleton-accent-bar-primary" />

      {/* Sidebar Skeleton */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card p-4">
        <div className="flex items-center gap-3 mb-8 p-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <nav className="space-y-2 skeleton-stagger">
          {[...Array(5)].map((_, i) => (
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
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500/20 to-fuchsia-500/20 flex items-center justify-center skeleton-icon-pulse">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-red-500/40 to-fuchsia-500/40" />
          </div>
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <span className="skeleton-loading-label text-muted-foreground">Loading your dashboard...</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-8 skeleton-stagger">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Recent Activity Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-1">
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

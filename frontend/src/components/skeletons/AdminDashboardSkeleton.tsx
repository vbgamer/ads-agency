import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCardSkeleton } from "./StatCardSkeleton";

export function AdminDashboardSkeleton() {
  return (
    <div className="flex min-h-screen bg-background skeleton-shimmer skeleton-shimmer-admin">
      {/* Top accent bar */}
      <div className="fixed top-0 left-0 right-0 z-50 skeleton-accent-bar skeleton-accent-bar-admin" />

      {/* Sidebar Skeleton */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card p-4">
        <div className="flex items-center gap-3 mb-8 p-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500/25 to-purple-500/25 skeleton-icon-pulse" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <nav className="space-y-2 skeleton-stagger">
          {[...Array(7)].map((_, i) => (
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
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500/20 to-purple-500/20 flex items-center justify-center skeleton-icon-pulse">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-red-500/40 to-purple-500/40" />
          </div>
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <span className="skeleton-loading-label text-muted-foreground">Loading admin panel...</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8 skeleton-stagger">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Two Column Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-8 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-8 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { MainLayout } from "@/components/layout/MainLayout";

export function CampaignDetailSkeleton() {
  return (
    <MainLayout>
      <div className="pb-28 md:pb-8 skeleton-shimmer skeleton-shimmer-primary">
        {/* Top accent bar */}
        <div className="skeleton-accent-bar skeleton-accent-bar-primary" />

        {/* Top bar */}
        <div className="px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Full-width media — shimmer sweep on image area */}
        <div className="px-4">
          <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-muted">
            <div className="absolute inset-0 skeleton-shimmer skeleton-shimmer-primary" />
          </div>
        </div>

        {/* Category + Title + Company */}
        <div className="px-4 pt-4 pb-2 space-y-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Floating cashback card */}
        <div className="-mt-2 mx-4 md:mx-auto md:max-w-2xl relative z-10">
          <div className="h-20 w-full rounded-2xl bg-gradient-to-r from-red-500/10 to-fuchsia-500/10 border border-red-500/10 skeleton-icon-pulse" />
        </div>

        {/* Grab Deal button */}
        <div className="max-w-2xl mx-auto px-4 mt-4">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Details content */}
        <div className="max-w-2xl mx-auto px-4 mt-6 space-y-5">
          {/* Info chips */}
          <div className="flex gap-3">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-36 rounded-full" />
          </div>

          {/* Company strip */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          {/* Coupon code box */}
          <div className="w-full p-4 border-2 border-dashed border-muted rounded-xl text-center space-y-2">
            <Skeleton className="h-3 w-16 mx-auto" />
            <Skeleton className="h-6 w-28 mx-auto" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>

          {/* Reactions */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-52" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="flex-1 h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

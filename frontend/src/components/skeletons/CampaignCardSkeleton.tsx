import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function CampaignCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Image placeholder with shimmer */}
      <div className="relative h-40 w-full bg-muted overflow-hidden">
        <div className="absolute inset-0 skeleton-shimmer skeleton-shimmer-primary" />
      </div>
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 w-20 rounded-full bg-gradient-to-r from-red-500/10 to-fuchsia-500/10 skeleton-icon-pulse" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

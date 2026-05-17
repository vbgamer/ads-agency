import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 skeleton-icon-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

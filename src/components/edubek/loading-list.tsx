/**
 * LoadingList — reusable skeleton list for paginated/gridded data.
 * Renders N skeleton rows that match the dimensions of typical card grids.
 */
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border/60 p-4">
          <Skeleton className="mb-3 h-24 w-full rounded-md" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="mb-2 h-3 w-1/2" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </Card>
      ))}
    </div>
  );
}

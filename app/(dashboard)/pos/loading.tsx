import { Skeleton } from "@/components/ui/skeleton";

export default function PosLoading() {
  return (
    <div
      className="min-h-screen space-y-6 bg-muted/30 p-4 md:p-6"
      aria-label="Loading point of sale"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-[720px]" />
        <Skeleton className="h-[480px]" />
      </div>
    </div>
  );
}

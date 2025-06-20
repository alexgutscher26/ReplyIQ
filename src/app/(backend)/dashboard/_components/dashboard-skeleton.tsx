import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-4 w-[250px]" />
      </div>
      <Separator />
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="size-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[100px]" />
                <Skeleton className="mt-1 h-3 w-[140px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="col-span-full">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
            <Skeleton className="h-10 w-[160px]" />
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <Skeleton className="aspect-3/1 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

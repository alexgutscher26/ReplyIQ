import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4 pb-16 sm:space-y-6 sm:p-6 lg:p-10">
      <div className="space-y-1 sm:space-y-0.5">
        <Skeleton className="h-6 w-[120px] sm:h-8 sm:w-[150px]" />
        <Skeleton className="h-4 w-[200px] sm:w-[250px]" />
      </div>
      
      <Separator className="my-4 sm:my-6" />
      
      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                <Skeleton className="h-4 w-[100px] sm:h-4 sm:w-[140px]" />
                <Skeleton className="size-4 sm:size-5" />
              </CardHeader>
              <CardContent className="space-y-1">
                <Skeleton className="h-6 w-[60px] sm:h-8 sm:w-[100px]" />
                <Skeleton className="h-3 w-[120px] sm:h-3 sm:w-[140px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card className="col-span-full">
          <CardHeader className="flex flex-col gap-2 space-y-0 border-b py-4 sm:flex-row sm:items-center sm:py-5">
            <div className="grid flex-1 gap-1 text-center sm:text-left">
              <Skeleton className="h-5 w-[140px] sm:h-6 sm:w-[200px] mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-[220px] sm:w-[300px] mx-auto sm:mx-0" />
            </div>
            <Skeleton className="h-9 w-full sm:h-10 sm:w-[160px]" />
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <div className="aspect-[4/3] w-full sm:aspect-[3/1]">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

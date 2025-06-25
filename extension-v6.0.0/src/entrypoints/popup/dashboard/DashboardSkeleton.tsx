import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm">Social Media Distribution</CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-36" />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="mx-auto aspect-square max-h-[250px] flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Circular skeleton for pie chart */}
            <Skeleton className="absolute h-[180px] w-[180px] rounded-full" />
            {/* Inner circle to create donut effect */}
            <div className="absolute h-[120px] w-[120px] rounded-full bg-card z-10" />
            {/* Center text placeholder */}
            <div className="absolute flex flex-col items-center justify-center z-20">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 w-full">
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="w-full">
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardFooter>
    </Card>
  )
}

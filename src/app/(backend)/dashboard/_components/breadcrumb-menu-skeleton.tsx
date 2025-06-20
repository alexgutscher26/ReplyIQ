import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

export default function BreadcrumbMenuSkeleton() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <Skeleton className="h-4 w-20" />
      </BreadcrumbList>
    </Breadcrumb>
  );
}

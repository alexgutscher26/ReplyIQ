import ProductsTable from "@/app/(backend)/dashboard/products/_components/products-table";
import { TableSkeleton } from "@/app/(backend)/dashboard/products/_components/table-skeleton";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/server/utils";
import { api, HydrateClient } from "@/trpc/server";
import { Suspense } from "react";

export default async function ProductsPage() {
  const session = await getSession();

  if (session?.user) {
    void api.products.all.prefetch();
  }

  return (
    <HydrateClient>
      <div className="space-y-6 p-10 pb-16 md:block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of your products that you can manage.
          </p>
        </div>
        <Separator />
        <div className="space-y-6">
          <Suspense fallback={<TableSkeleton />}>
            <ProductsTable />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}

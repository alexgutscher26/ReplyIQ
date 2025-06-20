import { DataTableColumnHeader } from "@/app/(backend)/dashboard/_components/data-table-column-header";
import ActionMenu from "@/app/(backend)/dashboard/products/_components/action-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type SelectProduct } from "@/server/db/schema/products-schema";
import { api } from "@/trpc/react";
import { type ProductType } from "@/utils/schema/products";
import { type ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<SelectProduct>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => <div>{row.getValue("description")}</div>,
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" />
    ),
    cell: ({ row }) => {
      const [settings] = api.settings.paymentProvider.useSuspenseQuery();
      const price: number = row.getValue("price");

      const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: settings.currency.toUpperCase(),
        currencySign: "standard",
      }).format(price);

      return <div>{currency}</div>;
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => <div className="capitalize">{row.getValue("type")}</div>,
  },
  {
    accessorKey: "mode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mode" />
    ),
    cell: ({ row }) => <div className="capitalize">{row.getValue("mode")}</div>,
  },
  {
    accessorKey: "limit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Limit" />
    ),
    cell: ({ row }) => {
      const limit: number = row.getValue("limit");

      return (
        <div>
          {limit} time{limit > 1 ? "s" : ""}
        </div>
      );
    },
  },
  {
    accessorKey: "hasTrial",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trial" />
    ),
    filterFn: (row, columnId, filterValue: boolean[]) => {
      if (!filterValue || filterValue.length === 0) {
        return true;
      }
      const rowValue = row.getValue<boolean>(columnId);
      return filterValue.includes(rowValue);
    },
    cell: ({ row }) => (
      <Badge
        variant={row.getValue("hasTrial") ? "default" : "secondary"}
        className="capitalize"
      >
        {row.getValue("hasTrial") ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    accessorKey: "trialDuration",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trial Duration" />
    ),
    cell: ({ row }) => {
      const duration: number = row.getValue("trialDuration");

      return (
        <div>
          {duration} day{duration > 1 ? "s" : ""}
        </div>
      );
    },
  },
  {
    accessorKey: "trialUsageLimit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trial Limit" />
    ),
    cell: ({ row }) => {
      const limit: number = row.getValue("trialUsageLimit");

      return (
        <div>
          {limit} time{limit > 1 ? "s" : ""}
        </div>
      );
    },
  },
  {
    accessorKey: "marketingTaglines",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Marketing Taglines" />
    ),
    cell: ({ row }) => {
      const taglines: ProductType["marketingTaglines"] =
        row.getValue("marketingTaglines");

      return (
        <div className="max-w-[200px] space-y-1">
          {taglines?.map((tagline, index) => (
            <div key={index} className="text-sm">
              {tagline.values}
            </div>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge
        variant={row.getValue("status") === "active" ? "default" : "secondary"}
        className="capitalize"
      >
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-default capitalize">
            {new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
              Math.floor(
                (new Date(row.getValue("createdAt")).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              ),
              "day",
            )}
          </TooltipTrigger>
          <TooltipContent>
            {new Date(row.getValue("createdAt")).toLocaleString("en-US", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              hour12: true,
            })}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated At" />
    ),
    cell: ({ row }) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-default capitalize">
            {new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
              Math.floor(
                (new Date(row.getValue("updatedAt")).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              ),
              "day",
            )}
          </TooltipTrigger>
          <TooltipContent>
            {new Date(row.getValue("updatedAt")).toLocaleString("en-US", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              hour12: true,
            })}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
  {
    id: "subscribers",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subscribers" />
    ),
    cell: ({ row }) => {
      const { data: count = 0 } = api.products.subscriber.useQuery(
        row.original.id,
        {
          suspense: false,
          refetchOnWindowFocus: false,
        },
      );

      return <div>{count}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ table, row }) => {
      return <ActionMenu table={table} row={row} source="cell" />;
    },
  },
];

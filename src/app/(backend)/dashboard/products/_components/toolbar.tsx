"use client";

import { DataTableViewOptions } from "@/app/(backend)/dashboard/_components/data-table-column-toggle";
import { DataTableFacetedFilter } from "@/app/(backend)/dashboard/_components/data-table-faceted-filter";
import ActionMenu from "@/app/(backend)/dashboard/products/_components/action-menu";
import ProductDialog from "@/app/(backend)/dashboard/products/_components/product-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Table } from "@tanstack/react-table";
import { X } from "lucide-react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter products ..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 max-w-[250px]"
        />
        {table.getColumn("type") && (
          <DataTableFacetedFilter
            column={table.getColumn("type")}
            title="Type"
          />
        )}
        {table.getColumn("mode") && (
          <DataTableFacetedFilter
            column={table.getColumn("mode")}
            title="Mode"
          />
        )}
        {table.getColumn("hasTrial") && (
          <DataTableFacetedFilter
            column={table.getColumn("hasTrial")}
            title="Trial"
          />
        )}
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
          />
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            className="h-8 px-2 lg:px-3"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <ProductDialog mode="create" />
        <DataTableViewOptions table={table} />
        <ActionMenu table={table} source="header" />
      </div>
    </div>
  );
}

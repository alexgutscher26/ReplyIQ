"use client";

import { DataTableViewOptions } from "@/app/(backend)/dashboard/_components/data-table-column-toggle";
import { DataTableFacetedFilter } from "@/app/(backend)/dashboard/_components/data-table-faceted-filter";
import ActionMenu from "@/app/(backend)/dashboard/users/_components/action-menu";
import CreateUserDialog from "@/app/(backend)/dashboard/users/_components/create-user-dialog";
import { type TableMeta } from "@/app/(backend)/dashboard/users/_components/users-table";
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
  const meta = table.options.meta as TableMeta;

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="h-8 max-w-xs"
        />
        {table.getColumn("role") && (
          <DataTableFacetedFilter
            column={table.getColumn("role")}
            title="Role"
          />
        )}
        {table.getColumn("banned") && (
          <DataTableFacetedFilter
            column={table.getColumn("banned")}
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
        <Input
          className="h-8 max-w-xs"
          placeholder="Search users..."
          value={meta.searchValue}
          onChange={(e) => meta.setSearchValue(e.target.value)}
        />
        <CreateUserDialog />
        <DataTableViewOptions table={table} />
        <ActionMenu table={table} source="header" />
      </div>
    </div>
  );
}

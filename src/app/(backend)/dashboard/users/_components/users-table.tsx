"use client";

import { DataTablePagination } from "@/app/(backend)/dashboard/_components/data-table-pagination";
import { columns } from "@/app/(backend)/dashboard/users/_components/columns";
import { DataTableToolbar } from "@/app/(backend)/dashboard/users/_components/toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/server/auth/client";
import { type User } from "@/server/auth/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useDebounce } from "@uidotdev/usehooks";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export interface TableMeta {
  searchValue: string;
  setSearchValue: (value: string) => void;
}

export default function UsersTable({ totalUsers }: { totalUsers?: number }) {
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 500);
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    banned: false,
    banReason: false,
    banExpires: false,
    emailVerified: false,
    updatedAt: false,
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "users",
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearch,
    ],
    queryFn: async () => {
      const data = await authClient.admin.listUsers(
        {
          query: {
            limit: pagination.pageSize,
            offset: pagination.pageIndex * pagination.pageSize,
            sortBy: "createdAt",
            sortDirection: "desc",
            ...(debouncedSearch && {
              searchField: "email",
              searchOperator: "contains",
              searchValue: debouncedSearch,
            }),
          },
        },
        {
          throw: true,
        },
      );

      const users = data.users as User[];
      const totalItems = totalUsers ?? 0;
      const hasNextPage = users.length === pagination.pageSize;

      return {
        users,
        hasNextPage,
        totalItems,
        pageIndex: pagination.pageIndex,
      };
    },
    placeholderData: keepPreviousData,
  });

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    pageCount: data ? Math.ceil(data.totalItems / pagination.pageSize) : 0,
    meta: {
      searchValue,
      setSearchValue,
    } satisfies TableMeta,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  return (
    <>
      <div className="flex items-center py-4">
        <DataTableToolbar table={table} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <Loader2 className="text-muted-foreground mx-auto size-4 animate-spin" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {error.message}
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </>
  );
}

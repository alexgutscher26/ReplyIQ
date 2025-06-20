"use client";

import CopyIdAction from "@/app/(backend)/dashboard/_components/copy-id-action";
import DeleteProductsAction from "@/app/(backend)/dashboard/products/_components/delete-products-action";
import ProductDialog from "@/app/(backend)/dashboard/products/_components/product-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type SelectProduct } from "@/server/db/schema/products-schema";
import { type Row, type Table } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import AssignUserAction from "./assign-user-action";

interface BaseActionMenuProps<TData> {
  table: Table<TData>;
  row?: Row<TData>;
  source?: "cell" | "header";
}

export interface ActionMenuProps<TData> extends BaseActionMenuProps<TData> {
  products: SelectProduct[];
  onSuccess?: () => void; // callback to close dropdown
}

export default function ActionMenu<TData>({
  table,
  row,
  source,
}: BaseActionMenuProps<TData>) {
  const [menuOpen, setMenuOpen] = useState(false);

  const products =
    source === "cell"
      ? ([row?.original] as SelectProduct[])
      : table
          ?.getSelectedRowModel()
          .rows.map((row) => row.original as SelectProduct);

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        {source === "header" ? (
          <Button variant="outline" className="ml-auto" size={"sm"}>
            <MoreHorizontal />
          </Button>
        ) : (
          <Button variant="ghost" className="size-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <CopyIdAction data={products} name="product" />
        <DropdownMenuSeparator />
        <ProductDialog
          mode="edit"
          products={products}
          onSuccess={() => setMenuOpen(false)}
        />
        <AssignUserAction
          data={products}
          onSuccess={() => setMenuOpen(false)}
        />
        <DeleteProductsAction
          table={table}
          products={products}
          onSuccess={() => setMenuOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

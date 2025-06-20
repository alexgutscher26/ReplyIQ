import { DataTableColumnHeader } from "@/app/(backend)/dashboard/_components/data-table-column-header";
import ActionMenu from "@/app/(backend)/dashboard/users/_components/action-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { avatarFallback } from "@/utils";

import { type ColumnDef } from "@tanstack/react-table";
import { type User } from "better-auth";
import { format, formatDistanceToNow } from "date-fns";

export const columns: ColumnDef<User>[] = [
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
    accessorKey: "image",
    header: () => (
      <Button
        size={"sm"}
        variant={"ghost"}
        className={"data-[state=open]:bg-accent -ml-3 h-8"}
      >
        Avatar
      </Button>
    ),
    cell: ({ row }) => (
      <Avatar className="size-6 rounded-lg">
        <AvatarImage
          src={row.getValue("image")}
          alt={row.getValue("name")}
          className="object-cover"
        />
        <AvatarFallback className="rounded-lg">
          {avatarFallback(row.getValue("name"))}
        </AvatarFallback>
      </Avatar>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "emailVerified",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Verified" />
    ),
    cell: ({ row }) => (
      <Badge
        variant={row.getValue("emailVerified") ? "default" : "secondary"}
        className="capitalize"
      >
        {row.getValue("emailVerified") ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => (
      <Badge
        variant={row.getValue("role") === "admin" ? "default" : "secondary"}
        className="capitalize"
      >
        {row.getValue("role")}
      </Badge>
    ),
  },
  {
    accessorKey: "banned",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Banned" />
    ),
    // Custom filter function for booleans:
    filterFn: (row, columnId, filterValue: boolean[]) => {
      // If user hasn't selected anything, show all
      if (!filterValue || filterValue.length === 0) {
        return true;
      }
      // row.value is true or false
      const rowValue = row.getValue<boolean>(columnId);
      // filterValue is array of booleans selected
      return filterValue.includes(rowValue);
    },
    cell: ({ row }) => (
      <Badge variant={row.getValue("banned") ? "destructive" : "secondary"}>
        {row.getValue<boolean>("banned") ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    accessorKey: "banReason",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reason" />
    ),
    cell: ({ row }) => <div>{row.getValue("banReason")}</div>,
  },
  {
    accessorKey: "banExpires",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ban Expires In" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("banExpires");

      return (
        <div className="capitalize">
          {formatDistanceToNow(new Date(date as string))}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt");

      return <div>{format(new Date(date as string), "PPpp")}</div>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated At" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("updatedAt");

      return (
        <div className="capitalize">
          {formatDistanceToNow(new Date(date as string))}
        </div>
      );
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

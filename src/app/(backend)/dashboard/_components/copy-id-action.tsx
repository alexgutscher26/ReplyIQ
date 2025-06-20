"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Copy } from "lucide-react";

interface CopyIdActionProps<TData extends { id: string }> {
  data: TData[];
  name: string;
}

export default function CopyIdAction<TData extends { id: string }>({
  data,
  name,
}: CopyIdActionProps<TData>) {
  return (
    <DropdownMenuItem
      onSelect={() =>
        navigator.clipboard.writeText(
          data?.length === 1 ? (data[0]?.id ?? "") : "",
        )
      }
      disabled={data?.length !== 1}
    >
      <Copy />
      {`Copy ${name} ID`}
    </DropdownMenuItem>
  );
}

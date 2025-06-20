"use client";

import { type ActionMenuProps } from "@/app/(backend)/dashboard/users/_components/action-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { authClient } from "@/server/auth/client";
import { type User } from "@/server/auth/types";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Unlock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function UnbanUsersAction<TData>({
  table,
  users,
}: ActionMenuProps<TData>) {
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    setIsPending(true);

    try {
      await Promise.all(
        users.map((user: User) =>
          authClient.admin.unbanUser({
            userId: user.id,
            fetchOptions: {
              onSuccess: () => {
                void queryClient.invalidateQueries({ queryKey: ["users"] });
              },
            },
          }),
        ),
      );

      toast.success("Success", {
        description: `Successfully unbanned ${users?.length} user${
          users?.length > 1 ? "s" : ""
        }`,
      });
    } catch (error: unknown) {
      toast.error("Uh oh! Something went wrong.", {
        description:
          error instanceof Error ? error.message : "An error occurred",
        action: {
          label: "Try again",
          onClick: () => {
            void handleSubmit();
          },
        },
      });
    } finally {
      setIsPending(false);
      table.resetRowSelection();
    }
  };

  return (
    <DropdownMenuItem
      disabled={
        isPending ||
        users?.length === 0 ||
        users?.every((user: User) => !user?.banned)
      }
      onSelect={() => handleSubmit()}
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Unlock />}
      Unban user{users?.length > 1 && "s"}
    </DropdownMenuItem>
  );
}

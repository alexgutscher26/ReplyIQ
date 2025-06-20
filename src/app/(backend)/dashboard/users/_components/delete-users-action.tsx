"use client";

import { type ActionMenuProps } from "@/app/(backend)/dashboard/users/_components/action-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-auth-hooks";
import { authClient } from "@/server/auth/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DeleteUsersAction<TData>({
  table,
  users,
  onSuccess,
}: ActionMenuProps<TData>) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const session = useSession();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    try {
      await Promise.all(
        users.map((user) =>
          authClient.admin.removeUser({
            userId: user?.id,
            fetchOptions: {
              onSuccess: () => {
                void queryClient.invalidateQueries({ queryKey: ["users"] });
              },
            },
          }),
        ),
      );

      toast.success("Success", {
        description: `Successfully deleted ${users?.length} user${
          users?.length > 1 ? "s" : ""
        }`,
      });

      setOpen(false);
    } catch (error: unknown) {
      toast.error("Uh oh! Something went wrong.", {
        description:
          error instanceof Error ? error.message : "An error occurred",
        action: {
          label: "Try again",
          onClick: () => {
            void handleSubmit(e);
          },
        },
      });
    } finally {
      setIsPending(false);
      onSuccess?.();
      table.resetRowSelection();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <DropdownMenuItem
            disabled={
              isPending ||
              users?.length === 0 ||
              users?.some((user) => user?.id === session?.data?.user?.id)
            }
            onSelect={(e) => (e.preventDefault(), setOpen(true))}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Delete user{users?.length > 1 && "s"}
          </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <DialogHeader className="grid gap-2">
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                account and remove the data from our servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  onSuccess?.();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={"destructive"}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="animate-spin" /> : "Delete"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

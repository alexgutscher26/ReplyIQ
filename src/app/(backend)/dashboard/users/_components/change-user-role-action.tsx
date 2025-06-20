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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/hooks/use-auth-hooks";
import { authClient } from "@/server/auth/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ChangeUserRoleAction<TData>({
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
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);

      await Promise.all(
        users.map((user) =>
          authClient.admin.setRole({
            userId: user.id,
            role: data.role as string,
            fetchOptions: {
              onSuccess: () => {
                void queryClient.invalidateQueries({ queryKey: ["users"] });
              },
            },
          }),
        ),
      );

      toast.success("Success", {
        description: `Successfully changed role for ${users.length} user${
          users.length > 1 ? "s" : ""
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
              users.length === 0 ||
              users.some((user) => user?.id === session?.data?.user?.id)
            }
            onSelect={(e) => (e.preventDefault(), setOpen(true))}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <UserCircle2 />}
            Change role{users.length > 1 && "s"}
          </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <DialogHeader className="grid gap-2">
              <DialogTitle>Change user role</DialogTitle>
              <DialogDescription>
                Select a new role for the selected user
                {users.length > 1 && "s"}.
              </DialogDescription>
            </DialogHeader>
            <SelectGroup className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role">User Role</Label>
              <Select name="role" required>
                <SelectTrigger id="role" className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </SelectGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : "Set role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

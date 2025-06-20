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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/hooks/use-auth-hooks";
import { authClient } from "@/server/auth/client";
import { SelectGroup } from "@radix-ui/react-select";
import { useQueryClient } from "@tanstack/react-query";
import { Ban, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BanUsersAction<TData>({
  table,
  users,
  onSuccess,
}: ActionMenuProps<TData>) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const session = useSession();
  const queryClient = useQueryClient();

  const getDurationInSeconds = (duration: string) => {
    const SECONDS_IN_DAY = 60 * 60 * 24;

    switch (duration) {
      case "1_day":
        return SECONDS_IN_DAY;
      case "1_week":
        return SECONDS_IN_DAY * 7;
      case "1_month":
        return SECONDS_IN_DAY * 30;
      case "3_months":
        return SECONDS_IN_DAY * 90;
      case "6_months":
        return SECONDS_IN_DAY * 180;
      case "1_year":
        return SECONDS_IN_DAY * 365;
      case "permanent":
        return null; // permanent ban
      default:
        return SECONDS_IN_DAY; // default 1 day
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);

      const banReason = data.banReason as string;
      const banExpiresIn = getDurationInSeconds(data.banDuration as string);

      await Promise.all(
        users.map((user) =>
          authClient.admin.banUser({
            userId: user.id,
            ...(banReason && { banReason }),
            ...(banExpiresIn && { banExpiresIn }), // only add if not permanent
            fetchOptions: {
              onSuccess: () => {
                void queryClient.invalidateQueries({ queryKey: ["users"] });
              },
            },
          }),
        ),
      );

      toast.success("Success", {
        description: `Successfully banned ${users.length} user${users.length > 1 ? "s" : ""}.`,
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
              users?.length === 0 ||
              isPending ||
              users.some(
                (user) =>
                  user?.banned ??
                  users?.some((user) => user?.id === session?.data?.user?.id),
              )
            }
            onSelect={(e) => (e.preventDefault(), setOpen(true))}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Ban />}
            Ban user{users?.length > 1 && "s"}
          </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban Users</DialogTitle>
            <DialogDescription>
              Select the duration for which you want to ban the selected users.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="banReason" className="text-right">
                  Ban Reason
                </Label>
                <Input
                  id="banReason"
                  name="banReason"
                  className="col-span-3"
                  defaultValue={"Spamming"}
                  required
                />
              </div>
              <SelectGroup className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="banDuration">Ban Duration</Label>
                <Select name="banDuration" required>
                  <SelectTrigger id="banDuration" className="col-span-3">
                    <SelectValue placeholder="Select ban duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_day">1 Day</SelectItem>
                    <SelectItem value="1_week">1 Week</SelectItem>
                    <SelectItem value="1_month">1 Month</SelectItem>
                    <SelectItem value="3_months">3 Months</SelectItem>
                    <SelectItem value="6_months">6 Months</SelectItem>
                    <SelectItem value="1_year">1 Year</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </SelectGroup>
            </div>
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
                {isPending ? <Loader2 className="animate-spin" /> : "Ban Users"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

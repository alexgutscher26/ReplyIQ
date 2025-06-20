"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { authClient } from "@/server/auth/client";
import { type SelectProduct } from "@/server/db/schema/products-schema";
import { api } from "@/trpc/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AssignUserActionProps {
  data: SelectProduct[];
  onSuccess?: () => void;
}

export default function AssignUserAction({
  data,
  onSuccess,
}: AssignUserActionProps) {
  const [open, setOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [value, setValue] = useState("");
  const queryClient = useQueryClient();
  const utils = api.useUtils();

  // Get active billings for the selected product
  const activeBillings = api.billings.getActiveBillingsByProduct.useQuery(
    { productId: data[0]?.id ?? "" },
    { enabled: !!data[0]?.id },
  );

  // Get users list with server-side search
  const {
    data: usersData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["users", data[0]?.id, activeBillings.data],
    queryFn: async () => {
      const usersResponse = await authClient.admin.listUsers({
        query: {
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      // Only proceed with filtering if we have both users and active billings
      if (!usersResponse.data?.users || !activeBillings.data) {
        return usersResponse;
      }

      // Get array of user IDs who already have this product
      const existingUserIds = new Set(
        activeBillings.data.map((billing) => billing.userId),
      );

      // Filter out users who already have an active billing
      const filteredUsers = usersResponse.data.users.filter(
        (user) => !existingUserIds.has(user.id),
      );

      return {
        ...usersResponse,
        data: {
          ...usersResponse.data,
          users: filteredUsers,
        },
      };
    },
    enabled: !!data[0]?.id && !activeBillings.isLoading,
  });

  const createBillingMutation = api.billings.createBilling.useMutation({
    onSuccess: async () => {
      // Invalidate all relevant queries
      await Promise.all([
        // Invalidate active billings
        utils.billings.getActiveBillingsByProduct.invalidate({
          productId: data[0]?.id ?? "",
        }),
        // Invalidate products subscriber count
        utils.products.subscriber.invalidate(),
        // Invalidate the users query
        queryClient.invalidateQueries({
          queryKey: ["users", data[0]?.id],
        }),
      ]);

      setOpen(false);
      onSuccess?.();

      toast.success("Success", {
        description: "Product assigned successfully",
      });
    },
    onError: (error) => {
      toast.error("Uh oh! Something went wrong.", {
        description: error.message,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const selectedProduct = data[0];
    const selectedUser = usersData?.data?.users?.find((u) => u.id === value);

    if (!selectedProduct || !selectedUser) return;

    createBillingMutation.mutate({
      userId: selectedUser.id,
      productId: selectedProduct.id,
      status: "active",
      provider: "manual",
      providerId: `manual_${Date.now()}`,
      providerTransactionId: `manual_${Date.now()}`,
      customerId: selectedUser.id,
      amount: "0",
      currency: "usd",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      metadata: {
        assignedBy: "admin",
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          disabled={!data.length || data.length > 1}
        >
          <UserPlus />
          Assign to user
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Product</DialogTitle>
            <DialogDescription>
              Assign this product to a user manually.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">
                User
              </Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="user"
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="col-span-3 justify-between"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin" />
                        <span>Loading users...</span>
                      </div>
                    ) : value ? (
                      usersData?.data?.users?.find((user) => user.id === value)
                        ?.email
                    ) : (
                      "Select user..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command
                    filter={(value, search) => {
                      if (!search) return 1;

                      const user = usersData?.data?.users?.find(
                        (u) => u.id === value,
                      );
                      if (!user) return 0;

                      const searchableText = [user.name, user.email]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                      return searchableText.includes(search.toLowerCase())
                        ? 1
                        : 0;
                    }}
                  >
                    <CommandInput placeholder="Search users by name or email..." />
                    <CommandList>
                      <CommandEmpty>No user found.</CommandEmpty>
                      {isLoading ? (
                        <CommandItem disabled>Loading...</CommandItem>
                      ) : isError ? (
                        <CommandItem disabled className="text-destructive">
                          <XCircle className="mr-2 h-4 w-4" />
                          {error?.message || "Failed to load users"}
                        </CommandItem>
                      ) : (
                        <CommandGroup>
                          {usersData?.data?.users?.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.id}
                              onSelect={() => {
                                setValue(user.id);
                                setPopoverOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.image ?? undefined} />
                                  <AvatarFallback>
                                    {user.name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm">{user.email}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {user.name}
                                  </span>
                                </div>
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  value === user.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={createBillingMutation.isPending || !value}
            >
              {createBillingMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "@/hooks/use-auth-hooks";
import { cn } from "@/lib/utils";
import { authClient } from "@/server/auth/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import {
  CalendarClock,
  Clock,
  InboxIcon,
  Laptop,
  Loader2,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";

export default function RevokeSpecificSessionsUserAction<TData>({
  table,
  users,
  onSuccess,
}: ActionMenuProps<TData>) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isTerminating, setIsTerminating] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { session } = useSession();

  // Only query if we have a valid user
  const { data: sessions } = useQuery({
    queryKey: ["userSessions", users[0]?.id],
    queryFn: async () => {
      if (!users[0]?.id) return { data: { sessions: [] } };
      return await authClient.admin.listUserSessions({ userId: users[0]?.id });
    },
    enabled: !!users[0]?.id && users.length === 1, // Only run for single user selection
  });

  const listOfActiveSessions = sessions?.data?.sessions ?? [];

  const revokeSpecificSession = async (sessionToken: string) => {
    await authClient.admin.revokeUserSession({
      sessionToken: sessionToken,
      fetchOptions: {
        onResponse: () => setIsTerminating(null),
        onRequest: () => setIsTerminating(sessionToken),
        onError: (ctx) => {
          toast.error("Uh oh! Something went wrong.", {
            description: ctx.error.message ?? "Failed to revoke session.",
            action: {
              label: "Try again",
              onClick: () => {
                void revokeSpecificSession(sessionToken);
              },
            },
          });

          setIsTerminating(null);
        },
        onSuccess: async () => {
          toast.success("Success", {
            description: "Session has been terminated.",
          });

          setIsTerminating(null);

          void queryClient.invalidateQueries({
            queryKey: ["userSessions", users[0]?.id],
          });
          void queryClient.invalidateQueries({
            queryKey: ["listSessions"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["multiDeviceSessions"],
          });
        },
      },
    });
  };

  const revokeAllSessions = async () => {
    await authClient.admin.revokeUserSessions({
      userId: users[0]?.id ?? "",
      fetchOptions: {
        onResponse: () => setIsPending(false),
        onRequest: () => setIsPending(true),
        onError: (ctx) => {
          toast.error("Uh oh! Something went wrong.", {
            description: ctx.error.message ?? "Failed to revoke sessions.",
            action: {
              label: "Try again",
              onClick: () => {
                void revokeAllSessions();
              },
            },
          });
        },
        onSuccess: async () => {
          toast.success("Success", {
            description: "All sessions have been terminated.",
          });

          setIsPending(false);
          void queryClient.invalidateQueries({
            queryKey: ["userSessions", users[0]?.id],
          });
          void queryClient.invalidateQueries({
            queryKey: ["listSessions"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["multiDeviceSessions"],
          });
          onSuccess?.();
          table.resetRowSelection();
        },
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <DropdownMenuItem
            disabled={isPending || users.length === 0 || users.length > 1}
            onSelect={(e) => (e.preventDefault(), setOpen(true))}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Revoke sessions
          </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent>
          <div className="grid gap-6">
            <DialogHeader className="grid gap-2">
              <DialogTitle>Active sessions</DialogTitle>
              <DialogDescription>
                Manage active sessions for the selected user
              </DialogDescription>
            </DialogHeader>
            <ScrollArea
              className={cn({
                "h-[300px]":
                  listOfActiveSessions.filter(
                    (s) => s.userAgent && s.id !== session?.id,
                  ).length > 0,
                "rounded-md border": true,
              })}
            >
              <div className="space-y-4 p-4">
                {listOfActiveSessions.filter(
                  (s) => s.userAgent && s.id !== session?.id,
                ).length === 0 && (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <InboxIcon className="text-muted-foreground mb-2 size-10" />
                    <p className="text-muted-foreground text-sm">
                      No other active sessions found
                    </p>
                  </div>
                )}

                {listOfActiveSessions
                  .filter((s) => s.userAgent && s.id !== session?.id)
                  .map((s) => {
                    return (
                      <div
                        key={s.id}
                        className="bg-secondary flex items-center justify-between rounded-lg p-4"
                      >
                        <div className="flex items-center">
                          {new UAParser(s.userAgent ?? "").getDevice().type ===
                          "mobile" ? (
                            <Smartphone className="mr-2 size-4" />
                          ) : (
                            <Laptop className="mr-2 size-4" />
                          )}

                          <div>
                            <p className="font-medium">
                              {
                                new UAParser(s.userAgent ?? "").getBrowser()
                                  .name
                              }{" "}
                              on{" "}
                              {
                                new UAParser(s.userAgent ?? "").getDevice()
                                  .model
                              }
                            </p>
                            <div className="text-muted-foreground flex flex-col flex-wrap text-sm">
                              <div className="flex items-center">
                                <Clock className="mr-1 size-3" />
                                <span>
                                  Last active:{" "}
                                  {formatDistance(
                                    new Date(s.updatedAt),
                                    new Date(),
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <CalendarClock className="mr-1 size-3" />
                                <span>
                                  Expires in{" "}
                                  {formatDistance(
                                    new Date(s.expiresAt),
                                    new Date(),
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeSpecificSession(s.token)}
                          disabled={isTerminating === s.token}
                        >
                          {isTerminating === s.token ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Terminate"
                          )}
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
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
                onClick={revokeAllSessions}
              >
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Revoke all sessions"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

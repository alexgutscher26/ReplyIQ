"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useSession } from "@/hooks/use-auth-hooks";
import { useListSessions } from "@/hooks/use-session-hooks";
import { authClient } from "@/server/auth/client";
import {
  type TerminateActiveSessionFormValues,
  TerminateActiveSessionSchema,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistance } from "date-fns";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";

export function ActiveSessionUserCardSettingsForm() {
  const router = useRouter();
  const {
    user,
    session: currentSession,
    isPending,
    isError,
    error,
  } = useSession();
  const { data: sessions, refetch } = useListSessions();
  const [sessionToTerminate, setSessionToTerminate] = useState<string | null>(
    null,
  );

  const form = useForm<TerminateActiveSessionFormValues>({
    resolver: zodResolver(TerminateActiveSessionSchema),
    defaultValues: {
      terminate: false,
    },
  });

  const onSubmit = async (token: string) => {
    setSessionToTerminate(token);

    await authClient.revokeSession({
      token,
      fetchOptions: {
        onError: ({ error }) => {
          toast.error("Uh oh! Something went wrong.", {
            description: error.message ?? "An error occurred",
            action: {
              label: "Try again",
              onClick: () => {
                void onSubmit(token);
              },
            },
          });
        },
        onSuccess: async () => {
          toast.success("Success", {
            description: "Session has been terminated successfully.",
          });

          // If the session being terminated is the current session, redirect the page to log the user out.
          if (currentSession?.token === token)
            return router.push("/auth/sign-out");

          setSessionToTerminate(null);
          await refetch();
        },
      },
    });
  };

  if (isPending || !user)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (isError)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-red-500">{error?.message}</p>
      </div>
    );

  if (!sessions || sessions.length === 0)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-gray-500">No active sessions found.</p>
      </div>
    );

  return (
    <Form {...form}>
      <form className="space-y-3">
        <h3 className="mb-4 text-lg font-medium">Active Sessions</h3>
        {(sessions ?? []).map((s) => {
          return (
            <FormField
              key={s.id}
              control={form.control}
              name="terminate"
              render={() => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {`${new UAParser(s.userAgent ?? "").getBrowser().name} on ${new UAParser(s.userAgent ?? "").getDevice().model}`}
                    </FormLabel>
                    <FormDescription>
                      {`Last active ${formatDistance(new Date(s.updatedAt ?? new Date()), new Date())} ago, expires in ${formatDistance(new Date(s.expiresAt ?? new Date()), new Date())}.`}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onSubmit(s.token)}
                      disabled={
                        sessionToTerminate === s.token ||
                        form.formState.isSubmitting ||
                        form.formState.isLoading ||
                        form.formState.isDirty
                      }
                    >
                      {sessionToTerminate === s.token ||
                      form.formState.isSubmitting ||
                      form.formState.isLoading ||
                      form.formState.isDirty ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Terminate"
                      )}
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />
          );
        })}
      </form>
    </Form>
  );
}

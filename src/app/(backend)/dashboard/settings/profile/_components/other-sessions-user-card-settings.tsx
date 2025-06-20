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
import { useListSessions } from "@/hooks/use-session-hooks";
import { authClient } from "@/server/auth/client";
import {
  TerminateActiveSessionSchema,
  type TerminateOtherSessionsFormValues,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function OtherSessionsUserCardSettingsForm() {
  const { refetch, isPending, isError, error } = useListSessions();

  const form = useForm<TerminateOtherSessionsFormValues>({
    resolver: zodResolver(TerminateActiveSessionSchema),
    defaultValues: {
      terminate: false,
    },
  });

  const onSubmit = async () => {
    await authClient.revokeOtherSessions({
      fetchOptions: {
        onError: ({ error }) => {
          toast.error("Uh oh! Something went wrong.", {
            description: error.message ?? "An error occurred",
            action: {
              label: "Try again",
              onClick: () => {
                void onSubmit();
              },
            },
          });
        },
        onSuccess: async () => {
          toast.success("Success", {
            description: "All other sessions have been revoked.",
          });

          await refetch();
        },
      },
    });
  };

  if (isPending)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (isError)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-center text-red-600">{error.message}</p>
      </div>
    );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="mb-4 text-lg font-medium">Other Sessions</h3>
        <FormField
          control={form.control}
          name="terminate"
          render={() => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Revoke all</FormLabel>
                <FormDescription>
                  Sessions that are currently active on other devices.
                </FormDescription>
              </div>
              <FormControl>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="hover:bg-destructive/10 hover:text-destructive"
                  disabled={
                    form.formState.isSubmitting ||
                    form.formState.isLoading ||
                    form.formState.isDirty
                  }
                >
                  {form.formState.isSubmitting ||
                  form.formState.isLoading ||
                  form.formState.isDirty ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Revoke"
                  )}
                </Button>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/hooks/use-auth-hooks";
import { authClient } from "@/server/auth/client";
import {
  type DeleteAccountFormValues,
  deleteAccountSchema,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function DeleteAccountCardSettingsForm() {
  const { isPending, isError, error } = useSession();

  const form = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      deleteAccount: false,
    },
  });

  const onSubmit = async () => {
    await authClient.deleteUser({
      callbackURL: "/auth/sign-out",
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
          toast.info("Verification email sent", {
            description: "Please check your email to confirm account deletion.",
          });
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
        <p className="text-red-500">{error?.message}</p>
      </div>
    );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="mb-4 text-lg font-medium">Account Terminations</h3>
        <FormField
          control={form.control}
          name="deleteAccount"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Delete Account</FormLabel>
                <FormDescription>
                  This will delete your account and all associated data
                  permanently.
                </FormDescription>
                <FormMessage />
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="hover:bg-destructive/10 hover:text-destructive"
          disabled={
            form.formState.isSubmitting ||
            form.formState.isLoading ||
            !form.watch("deleteAccount")
          }
        >
          {form.formState.isSubmitting || form.formState.isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Delete Account"
          )}
        </Button>
      </form>
    </Form>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-auth-hooks";
import { authClient } from "@/server/auth/client";
import {
  type UpdateUserPasswordSettingsFormValues,
  UpdateUserPasswordSettingsSchema,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function UpdateUserPasswordSettingsForm() {
  const { user, isPending, refetch, isError, error } = useSession();

  const form = useForm<UpdateUserPasswordSettingsFormValues>({
    resolver: zodResolver(UpdateUserPasswordSettingsSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      revokeOtherSessions: true,
    },
  });

  async function onSubmit(data: UpdateUserPasswordSettingsFormValues) {
    await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: data.revokeOtherSessions,
      fetchOptions: {
        onError: ({ error }) => {
          toast.error("Uh oh! Something went wrong.", {
            description: error.message ?? "Failed to update password.",
            action: {
              label: "Try again",
              onClick: () => {
                void onSubmit(data);
              },
            },
          });
        },
        onSuccess: async () => {
          toast.success("Success", {
            description: "Your password has been updated.",
          });

          await refetch();
        },
      },
    });
  }

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="mb-4 text-lg font-medium">Update Password</h3>
        <div className="space-y-4 rounded-lg border p-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Current Password"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Your current password.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Your New Password"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Your new password.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmNewPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm New Password"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Confirm your new password.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="revokeOtherSessions"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Revoke Other Sessions</FormLabel>
                  <FormDescription>
                    Log out of other sessions across all of your devices.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            size={"sm"}
            variant={"outline"}
            disabled={
              isPending ||
              form.formState.isSubmitting ||
              !form.formState.isValid ||
              !form.formState.isDirty
            }
          >
            {isPending || form.formState.isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

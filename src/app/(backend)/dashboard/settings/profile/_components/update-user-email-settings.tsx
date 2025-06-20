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
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-auth-hooks";
import { authClient } from "@/server/auth/client";
import {
  type UpdateUserEmailSettingsFormValues,
  updateUserEmailSettingsSchema,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function UpdateUserEmailSettingsForm() {
  const { user, isPending, refetch, isError, error } = useSession();

  const form = useForm<UpdateUserEmailSettingsFormValues>({
    resolver: zodResolver(updateUserEmailSettingsSchema),
    defaultValues: {
      currentEmail: "",
      newEmail: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        currentEmail: user.email ?? "",
        newEmail: "",
      });
    }
  }, [user, form]);

  async function onSubmit(data: UpdateUserEmailSettingsFormValues) {
    await authClient.changeEmail({
      newEmail: data.newEmail,
      callbackURL: "/dashboard",
      fetchOptions: {
        onError: ({ error }) => {
          toast.error("Uh oh! Something went wrong.", {
            description:
              error.message ?? "Failed to update email. Please try again.",
            action: {
              label: "Try again",
              onClick: () => {
                void onSubmit(data);
              },
            },
          });
        },
        onSuccess: async () => {
          if (user?.emailVerified) {
            toast.info("Verification email sent", {
              description: "Please check your email to confirm email change.",
            });
          } else {
            toast.success("Success", {
              description: "Your email has been updated.",
            });

            await refetch();
          }
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
        <h3 className="mb-4 text-lg font-medium">Update Email Address</h3>
        <div className="space-y-4 rounded-lg border p-4">
          <FormField
            control={form.control}
            name="currentEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Email</FormLabel>
                <FormControl>
                  <Input placeholder="Current Email" {...field} />
                </FormControl>
                <FormDescription>Your current email address.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Email</FormLabel>
                <FormControl>
                  <Input placeholder="Your New Email" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the new email address you wish to use.
                </FormDescription>
                <FormMessage />
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
              "Update Email"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

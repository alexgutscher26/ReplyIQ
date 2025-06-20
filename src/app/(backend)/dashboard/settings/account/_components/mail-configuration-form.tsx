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
import { api } from "@/trpc/react";
import {
  type MailConfiguration,
  mailConfigurationSchema,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function MailConfigurationForm() {
  const utils = api.useUtils();
  const [mail] = api.settings.mailConfiguration.useSuspenseQuery();
  const update = api.settings.updateMailConfiguration.useMutation({
    onSuccess: async () => {
      toast.success("Mail configuration updated", {
        description: "Your mail configuration settings have been saved.",
      });

      await utils.settings.mailConfiguration.invalidate();
    },
    onError: (error) => {
      toast.error("Uh oh! Something went wrong.", {
        description:
          error.message || "Failed to update settings. Please try again.",
        action: {
          label: "Try again",
          onClick: () => {
            update.mutate(form.getValues());
          },
        },
      });
    },
  });

  const form = useForm<MailConfiguration>({
    resolver: zodResolver(mailConfigurationSchema),
    defaultValues: mail,
  });

  async function onSubmit(formData: MailConfiguration) {
    update.mutate(formData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="mb-4 text-lg font-medium">Resend Mail Configuration</h3>
        <div className="space-y-4 rounded-lg border p-4">
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="API key" {...field} />
                </FormControl>
                <FormDescription>
                  API key for sending emails via Resend.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fromEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Email</FormLabel>
                <FormControl>
                  <Input placeholder="contact@support.example.com" {...field} />
                </FormControl>
                <FormDescription>
                  The email address from which the emails will be sent.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...field} />
                </FormControl>
                <FormDescription>
                  The name of the recipient for the emails.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To Email</FormLabel>
                <FormControl>
                  <Input placeholder="Your Email" {...field} />
                </FormControl>
                <FormDescription>
                  The email address of the recipient for the emails.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={update.isPending || !form.formState.isDirty}
          >
            {update.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

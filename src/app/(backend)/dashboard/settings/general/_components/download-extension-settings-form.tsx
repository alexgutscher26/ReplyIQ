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
  type DownloadExtension,
  downloadExtensionSchema,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function DownloadExtensionSettingsForm() {
  const utils = api.useUtils();
  const [settings] = api.settings.downloadExtension.useSuspenseQuery();
  const update = api.settings.updateDownloadExtension.useMutation({
    onSuccess: async () => {
      toast.success("Success", {
        description: "Your download extension settings have been saved.",
      });

      await utils.settings.downloadExtension.invalidate();
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

  const form = useForm<DownloadExtension>({
    resolver: zodResolver(downloadExtensionSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [form, settings]);

  async function onSubmit(formData: DownloadExtension) {
    update.mutate(formData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="mb-4 text-lg font-medium">Extension URLs</h3>
        <div className="space-y-4 rounded-lg border p-4">
          <FormField
            control={form.control}
            name="chrome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chrome</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormDescription>URL for the Chrome extension.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="firefox"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firefox</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormDescription>
                  URL for the Firefox extension.
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

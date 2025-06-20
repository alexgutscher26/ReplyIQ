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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import {
  AI_MODEL_LIST,
  STORAGE_PROVIDERS_LIST,
  type StorageProviderSettings,
  storageProviderSettingsSchema,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function UpdateStorageProviderSettingsForm() {
  const utils = api.useUtils();
  const [settings] = api.settings.storageProvider.useSuspenseQuery();
  const update = api.settings.updateStorageProvider.useMutation({
    onSuccess: async () => {
      toast.success("Success", {
        description: "Your storage provider settings have been saved.",
      });

      await utils.settings.storageProvider.invalidate();
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

  const form = useForm<StorageProviderSettings>({
    resolver: zodResolver(storageProviderSettingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [form, settings]);

  async function onSubmit(data: StorageProviderSettings) {
    update.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="mb-4 text-lg font-medium">Storage Provider Settings</h3>
        <div className="space-y-4 rounded-lg border p-4">
          <FormField
            control={form.control}
            name="enabledProviders"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enabled Providers</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange([value])}
                  value={field.value?.[0]}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a storage provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STORAGE_PROVIDERS_LIST.map((provider, i) => (
                      <SelectItem key={i} value={provider.key}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select a storage provider to enable
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter API key for the selected model"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter the API key for{" "}
                  {
                    AI_MODEL_LIST.find(
                      (m) => m.key === form.watch("enabledProviders")[0],
                    )?.name
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={
              update.isPending ||
              !form.formState.isValid ||
              !form.formState.isDirty
            }
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

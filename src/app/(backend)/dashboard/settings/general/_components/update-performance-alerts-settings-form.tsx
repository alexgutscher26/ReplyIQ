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
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";
import { generalSettingsSchema, type GeneralSettings } from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function UpdatePerformanceAlertsSettingsForm() {
  const utils = api.useUtils();
  const { data: settings, isLoading } = api.settings.general.useQuery();
  const update = api.settings.updateGeneral.useMutation({
    onSuccess: async () => {
      toast.success("Success", {
        description: "Performance alert settings saved successfully.",
      });
      await utils.settings.general.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update settings", {
        description: error.message || "Please try again.",
      });
    },
  });

  const form = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: settings,
    values: settings,
  });

  if (isLoading || !settings) return <div>Loading...</div>;

  function onSubmit(data: GeneralSettings) {
    update.mutate({
      ...settings,
      performanceAlerts: data.performanceAlerts,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="text-sm leading-none font-medium">Performance Alert Thresholds</h3>
        <div className="space-y-4 rounded-lg border p-4">
          <FormField
            control={form.control}
            name="performanceAlerts.enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Enable Alerts</FormLabel>
                  <FormDescription>
                    Toggle to enable or disable performance alert emails.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="performanceAlerts.successRateThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Success Rate Threshold (%)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={100} step={0.1} {...field} />
                </FormControl>
                <FormDescription>
                  Send an alert if the success rate falls below this value.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="performanceAlerts.growthThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usage Growth Threshold (%)</FormLabel>
                <FormControl>
                  <Input type="number" min={-100} max={100} step={0.1} {...field} />
                </FormControl>
                <FormDescription>
                  Send an alert if usage growth drops below this value.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="performanceAlerts.errorRateThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Error Rate Threshold (%)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={100} step={0.1} {...field} />
                </FormControl>
                <FormDescription>
                  Send an alert if the error rate exceeds this value.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="sm" variant="outline" disabled={update.isPending}>
            {update.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 
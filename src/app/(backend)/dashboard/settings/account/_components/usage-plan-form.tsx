"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import PlanUpgradeDowngradeDialog from "./plan-upgrade-downgrade-dialog";

export default function UsagePlanForm() {
  const form = useForm();

  const { data: usageData, isLoading } = api.usage.getCurrentUsage.useQuery();

  const usagePercentage = usageData
    ? (usageData.used / usageData.limit) * 100
    : 0;

  return (
    <Form {...form}>
      <form className="space-y-3">
        <h3 className="mb-6 text-lg font-medium">Usage</h3>
        <FormField
          control={form.control}
          name="upgrade"
          render={() => (
            <FormItem className="space-y-4">
              <div className="space-y-3">
                <FormLabel className="flex items-center justify-between text-sm font-normal">
                  <span className="text-muted-foreground">AI Responses</span>
                  <span className="text-xs font-medium">
                    {isLoading ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      `${usageData?.used ?? 0}/${usageData?.limit ?? 0}`
                    )}
                  </span>
                </FormLabel>
                <Progress
                  value={isLoading ? 0 : usagePercentage}
                  className={`h-0.5 transition-all duration-300 ${
                    isLoading ? "bg-muted animate-pulse" : "bg-secondary"
                  }`}
                />
                <FormDescription className="text-xs">
                  {isLoading ? (
                    <span className="animate-pulse">Loading usage data...</span>
                  ) : usageData?.periodEnd ? (
                    <>
                      Resets on{" "}
                      {new Date(usageData.periodEnd).toLocaleDateString()}
                    </>
                  ) : (
                    "Basic features with limited AI responses."
                  )}
                </FormDescription>
              </div>
              <FormControl>
                <PlanUpgradeDowngradeDialog />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

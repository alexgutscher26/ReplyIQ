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
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import PlanUpgradeDowngradeDialog from "./plan-upgrade-downgrade-dialog";

export default function CurrentPlanForm() {
  const router = useRouter();
  const { data: currentBilling, isLoading: isLoadingBilling } =
    api.payments.getCurrentBilling.useQuery();

  const billing = api.payments.manageBilling.useMutation({
    onSuccess: async (data) => {
      router.push(data.url);
    },
    onError: (error) => {
      toast.error("Uh oh! Something went wrong.", {
        description: error.message || "Failed to access billing portal.",
        action: {
          label: "Try again",
          onClick: () => {
            billing.mutate();
          },
        },
      });
    },
  });

  const form = useForm();

  const onSubmit = () => {
    billing.mutate();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="text-sm leading-none font-medium">Current plan</h3>
        <FormField
          control={form.control}
          name="upgrade"
          render={() => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {currentBilling?.product?.name ?? "No plan"}
                </FormLabel>
                <FormDescription>
                  {currentBilling?.product?.description ??
                    "Subscribe to a plan to access more features."}
                </FormDescription>
              </div>
              <FormControl>
                {isLoadingBilling ? (
                  <Button variant="secondary" size="sm" disabled>
                    <Loader2 className="size-4 animate-spin" />
                  </Button>
                ) : currentBilling?.status === "active" ? (
                  currentBilling.product?.isFree ? (
                    <PlanUpgradeDowngradeDialog />
                  ) : (
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      disabled={
                        billing.isPending || form.formState.isSubmitting
                      }
                    >
                      {billing.isPending ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Manage Billing"
                      )}
                    </Button>
                  )
                ) : (
                  <PlanUpgradeDowngradeDialog />
                )}
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

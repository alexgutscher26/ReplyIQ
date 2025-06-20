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
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function CancelPlanForm() {
  const utils = api.useUtils();
  const { data: currentBilling } = api.payments.getCurrentBilling.useQuery();

  const billing = api.payments.cancelSubscription.useMutation({
    onSuccess: async () => {
      await utils.payments.getCurrentBilling.invalidate();

      toast.success("Subscription canceled", {
        description: "Your subscription has been canceled.",
      });
    },
    onError: (error) => {
      toast.error("Uh oh! Something went wrong.", {
        description: error.message || "Failed to cancel subscription.",
        action: {
          label: "Try again",
          onClick: () =>
            billing.mutate({
              subscriptionId: currentBilling?.providerId ?? "",
            }),
        },
      });
    },
  });

  const form = useForm();

  const onSubmit = () => {
    billing.mutate({ subscriptionId: currentBilling?.providerId ?? "" });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="mb-4 text-lg font-medium">Cancel Subscription</h3>
        <FormField
          control={form.control}
          name="subscription"
          render={() => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Subscription</FormLabel>
                <FormDescription>
                  Your subscription will be canceled immediately.
                </FormDescription>
              </div>
              <FormControl>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={billing.isPending || form.formState.isSubmitting}
                >
                  {billing.isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    "Cancel"
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

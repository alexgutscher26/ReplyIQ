"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { TRPCClientError } from "@trpc/client";
import { Loader2, Package } from "lucide-react"; // Add this import
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function PlanUpgradeDowngradeDialog() {
  const utils = api.useUtils();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>();

  // Fetch active products
  const { data: products, isLoading: isLoadingProducts } =
    api.products.active.useQuery();

  // Fetch current user's billing info
  const { data: currentBilling, isLoading: isLoadingBilling } =
    api.payments.getCurrentBilling.useQuery();

  // Mutation for changing plan
  const { mutate: changePlan, isPending: isChangingPlan } =
    api.payments.changePlan.useMutation({
      onSuccess: async () => {
        setOpen(false);
        await utils.payments.getCurrentBilling.invalidate();

        toast.success("Plan changed", {
          description: "Your plan has been updated successfully.",
        });
      },
      onError: (error) => {
        if (error instanceof TRPCClientError) {
          toast.error("Uh oh! Something went wrong.", {
            description: error.message ?? "Failed to change plan.",
            action: {
              label: "Try again",
              onClick: () => {
                changePlan({
                  newProductId: selectedProductId ?? "",
                  subscriptionId: currentBilling?.providerId ?? "",
                });
              },
            },
          });
        }
      },
    });

  // Add checkout mutation with isPending
  const { mutate: checkout, isPending: isCheckingOut } =
    api.payments.createCheckout.useMutation({
      onSuccess: async ({ url, type }) => {
        if (type === "free") {
          await utils.payments.getCurrentBilling.invalidate();
          setOpen(false);
          return;
        }

        router.push(url);
      },
      onError: (error) => {
        if (error instanceof TRPCClientError) {
          toast.error("Uh oh! Something went wrong.", {
            description: error.message ?? "Failed to create checkout session.",
            action: {
              label: "Try again",
              onClick: () => {
                checkout({ productId: selectedProductId ?? "" });
              },
            },
          });
        }
      },
    });

  const handlePlanChange = () => {
    if (!selectedProductId) return;

    const selectedProduct = products?.find((p) => p.id === selectedProductId);

    // If user has no billing, or is on free plan, or switching to free plan
    // always use checkout flow
    if (
      !currentBilling ||
      currentBilling.product?.isFree ||
      !currentBilling.providerId ||
      selectedProduct?.isFree
    ) {
      checkout({ productId: selectedProductId });
      return;
    }

    changePlan({
      newProductId: selectedProductId,
      subscriptionId: currentBilling.providerId,
    });
  };

  const selectedProduct = products?.find((p) => p.id === selectedProductId);
  const isSelectedProductFree = selectedProduct?.isFree ?? false;
  const isCurrentPlanFree = !currentBilling?.providerId;

  const isLoading = isLoadingProducts || isLoadingBilling;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isCurrentPlanFree ? (
            "Upgrade Plan"
          ) : (
            "Change Plan"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Change Your Plan</DialogTitle>
        <DialogDescription>
          Select a new plan to upgrade or downgrade your current subscription.
        </DialogDescription>

        <div className="space-y-4 py-4">
          {!products?.length ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <Package className="text-muted-foreground size-10" />
              <h3 className="mt-4 font-semibold">No Plans Available</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                There are currently no plans available for subscription.
              </p>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  selectedProductId === product.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                } ${
                  currentBilling?.productId === product.id
                    ? "border-primary/50 bg-muted"
                    : ""
                }`}
                onClick={() => setSelectedProductId(product.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {product.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${Number(product.price).toFixed(2)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      per {product.type}
                    </p>
                  </div>
                </div>
                {currentBilling?.productId === product.id && (
                  <p className="text-primary mt-2 text-sm">Current Plan</p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button size={"sm"} variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size={"sm"}
            variant={"outline"}
            onClick={handlePlanChange}
            disabled={
              isChangingPlan ||
              isCheckingOut ||
              !selectedProductId ||
              selectedProductId === currentBilling?.productId ||
              (isSelectedProductFree && currentBilling?.status === "active")
            }
          >
            {isChangingPlan || isCheckingOut ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {isCurrentPlanFree ? "Upgrading..." : "Changing..."}
              </>
            ) : isCurrentPlanFree ? (
              "Upgrade" // Show Upgrade for free plan users
            ) : (
              "Confirm Change"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

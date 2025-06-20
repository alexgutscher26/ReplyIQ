"use client";

import { type ActionMenuProps } from "@/app/(backend)/dashboard/products/_components/action-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Form } from "@/components/ui/form";
import { api } from "@/trpc/react";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function DeleteProductsAction<TData>({
  table,
  products,
  onSuccess,
}: ActionMenuProps<TData>) {
  const [open, setOpen] = useState(false);
  const form = useForm();
  const utils = api.useUtils();
  const subscribers = products.map((product) =>
    api.products.subscriber.useQuery(
      product?.id,
      { enabled: open }, // Only fetch when dialog is open
    ),
  );

  const hasSubscribers = subscribers.some((query) => (query.data ?? 0) > 0);
  const deleteProduct = api.products.delete.useMutation({
    onSuccess: async () => {
      setOpen(false);
      onSuccess?.();

      table.resetRowSelection();
      await utils.products.all.invalidate();

      toast.success("Product deleted", {
        description: `Successfully deleted ${products?.length} product${
          products?.length > 1 ? "s" : ""
        }`,
      });
    },
    onError: (error) => {
      toast.error("Uh oh! Something went wrong.", {
        description:
          error instanceof Error ? error.message : "An error occurred",
        action: {
          label: "Try again",
          onClick: () => void onSubmit(),
        },
      });
    },
  });

  const onSubmit = async () => {
    await Promise.all(
      products.map((product) =>
        deleteProduct.mutate({
          id: product?.id,
        }),
      ),
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => (e.preventDefault(), setOpen(true))}
          disabled={!products?.length || hasSubscribers}
        >
          {deleteProduct.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 />
              Delete product{products?.length > 1 && "s"}
            </>
          )}
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <DialogHeader className="grid gap-2">
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                product{products?.length > 1 && "s"} from the database.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  onSuccess?.();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={"destructive"}
                disabled={deleteProduct.isPending}
              >
                {deleteProduct.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  `Delete product${products?.length > 1 ? "s" : ""}`
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

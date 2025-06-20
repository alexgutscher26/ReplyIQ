"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
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
import { Switch } from "@/components/ui/switch";
import { type SelectProduct } from "@/server/db/schema/products-schema";
import { api } from "@/trpc/react";
import {
  productFormSchema,
  productModeEnum,
  productStatusEnum,
  type ProductType,
  productTypeEnum,
} from "@/utils/schema/products";
import { zodResolver } from "@hookform/resolvers/zod";
import { TRPCClientError } from "@trpc/client";
import { Loader2, Minus, Pencil, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

interface ProductDialogProps {
  mode: "create" | "edit";
  products?: SelectProduct[];
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function ProductDialog({
  mode,
  products = [], // Set default value here
  trigger,
  onSuccess,
}: ProductDialogProps) {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  // Get single product for editing if exactly one product is selected
  const product = products && products.length === 1 ? products[0] : undefined;

  // Prevent opening dialog if trying to edit multiple products
  const canOpen = mode === "create" || (mode === "edit" && product);

  const { mutate: createProduct, isPending: isCreating } =
    api.products.createProduct.useMutation({
      onSuccess: handleSuccess,
      onError: handleError,
    });

  const { mutate: updateProduct, isPending: isUpdating } =
    api.products.update.useMutation({
      onSuccess: handleSuccess,
      onError: handleError,
    });

  const form = useForm<ProductType>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description ?? "",
          price: Number(product.price),
          type: product.type as "month" | "year",
          mode: product.mode as "subscription" | "payment",
          limit: product.limit ?? 5,
          hasTrial: product.hasTrial ?? false,
          trialDuration: product.trialDuration ?? 1,
          trialUsageLimit: product.trialUsageLimit ?? 5,
          status: product.status as "active" | "inactive" | "archived",
          marketingTaglines: product.marketingTaglines?.map((t) => ({
            values:
              typeof t === "string"
                ? t
                : ((t as { values: string }).values ?? ""),
          })) ?? [{ values: "" }],
        }
      : productFormSchema.parse({}),
  });

  const { fields, append, remove } = useFieldArray({
    name: "marketingTaglines",
    control: form.control,
  });

  const onSubmit = async (formData: ProductType) => {
    // Set price to 0 if it's a free product
    const submissionData = {
      ...formData,
      price: formData.isFree ? 0 : formData.price,
    };

    if (mode === "edit" && product) {
      updateProduct({ id: product.id, data: submissionData });
    } else {
      createProduct(submissionData);
    }
  };

  function handleSuccess() {
    setOpen(false);
    form.reset();
    onSuccess?.();
    void utils.products.all.invalidate();

    toast.success("Success", {
      description: `Product ${mode === "create" ? "created" : "updated"} successfully.`,
    });
  }

  function handleError(error: unknown) {
    if (error instanceof TRPCClientError) {
      toast.error("Uh oh! Something went wrong.", {
        description:
          error.message ?? `Failed to ${mode} product. Please try again.`,
        action: {
          label: "Try again",
          onClick: () => {
            if (mode === "create") {
              createProduct(form.getValues());
            } else {
              updateProduct({ id: product?.id ?? "", data: form.getValues() });
            }
          },
        },
      });
    }
  }

  // If no custom trigger is provided and it's edit mode, render the dropdown item
  const defaultTrigger =
    mode === "edit" ? (
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        disabled={!products || products.length !== 1}
      >
        <Pencil />
        Edit product
      </DropdownMenuItem>
    ) : (
      <Button size={"sm"} variant="outline">
        <PlusCircle />
      </Button>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!canOpen && newOpen) return;
        setOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[400px]">
        <DialogTitle className="text-xl font-semibold">
          {mode === "create" ? "New Product" : "Edit Product"}
        </DialogTitle>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFree"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-x-2">
                  <FormLabel className="font-normal">Free Product</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          form.setValue("price", 0, { shouldValidate: true });
                          form.setValue("hasTrial", false, {
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        disabled={form.watch("isFree")}
                        value={form.watch("isFree") ? "0" : field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? 0 : Number.parseFloat(value),
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        // Handle empty value
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? 0 : Number.parseInt(value, 10),
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mode</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productModeEnum.options.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("mode") === "subscription" && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productTypeEnum.options.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productStatusEnum.options.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Marketing Taglines</FormLabel>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <FormField
                    control={form.control}
                    key={field.id}
                    name={`marketingTaglines.${index}.values`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input
                              {...field}
                              placeholder={`Tagline ${index + 1}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <Minus className="size-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => append({ values: "" })}
                className="w-full"
              >
                Add Tagline
              </Button>
            </div>

            <FormField
              control={form.control}
              name="hasTrial"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-x-2">
                  <FormLabel className="font-normal">
                    Enable Trial Period
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={form.watch("isFree")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("hasTrial") && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trialDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number.parseInt(e.target.value, 10))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trialUsageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number.parseInt(e.target.value, 10))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                isCreating ||
                isUpdating ||
                !form.formState.isValid ||
                (!form.formState.isDirty && mode === "edit")
              }
            >
              {isCreating || isUpdating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Create Product"
              ) : (
                "Update Product"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { getBaseUrl } from "@/utils";
import {
  PAYPAL_WEBHOOK_EVENTS,
  type PaypalWebhookEvent,
  STRIPE_WEBHOOK_EVENTS,
  type StripeWebhookEvent,
  WEBHOOK_CONFIG_MODES,
  type WebhookForPaymentProvider,
  webhookForPaymentProviderSchema,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Command as CommandPrimitive } from "cmdk";
import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type ControllerRenderProps, useForm } from "react-hook-form";
import { toast } from "sonner";

// Add type for webhook events
type WebhookEvent = StripeWebhookEvent | PaypalWebhookEvent;
type WebhookEvents =
  | typeof STRIPE_WEBHOOK_EVENTS
  | typeof PAYPAL_WEBHOOK_EVENTS;

export default function UpdateWebhookForPaymentProviderForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const utils = api.useUtils();
  const [settings] = api.settings.webhookForPaymentProvider.useSuspenseQuery();
  const [paymentProvider] = api.settings.paymentProvider.useSuspenseQuery();
  const currentProvider = paymentProvider?.enabledProviders?.[0] ?? "stripe";

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLDivElement>,
      field: ControllerRenderProps<
        WebhookForPaymentProvider,
        "stripeEvents" | "paypalEvents"
      >,
    ) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "") {
            const newValue = [...(field.value ?? [])];
            newValue.pop();
            field.onChange(newValue);
          }
        }
        if (e.key === "Escape") {
          input.blur();
        }
      }
    },
    [],
  );

  // Properly typed webhook events
  const WEBHOOK_EVENTS: WebhookEvents =
    currentProvider === "stripe"
      ? STRIPE_WEBHOOK_EVENTS
      : PAYPAL_WEBHOOK_EVENTS;

  const update = api.settings.updateWebhookForPaymentProvider.useMutation({
    onSuccess: async () => {
      toast.success("Success", {
        description: "Your webhook settings have been saved successfully.",
      });

      await utils.settings.webhookForPaymentProvider.invalidate();

      // Reset form state but keep the current values
      form.reset(form.getValues(), {
        keepValues: true, // Keep the current form values
        keepDirtyValues: false, // Reset dirty state
      });
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

  const form = useForm<WebhookForPaymentProvider>({
    resolver: zodResolver(webhookForPaymentProviderSchema),
    defaultValues: {
      ...settings,
      // Set initial events based on provider
      stripeEvents:
        currentProvider === "stripe" ? settings.stripeEvents : undefined,
      paypalEvents:
        currentProvider === "paypal" ? settings.paypalEvents : undefined,
    },
  });

  // Reset form when provider changes
  useEffect(() => {
    const currentEvents = form.getValues(
      currentProvider === "stripe" ? "stripeEvents" : "paypalEvents",
    );

    form.reset({
      ...form.getValues(),
      // Clear previous provider's events
      stripeEvents: currentProvider === "stripe" ? currentEvents : undefined,
      paypalEvents: currentProvider === "paypal" ? currentEvents : undefined,
    });
  }, [currentProvider, form]);

  async function onSubmit(formData: WebhookForPaymentProvider) {
    update.mutate(formData);
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="mb-4 text-lg font-medium">
          {currentProvider === "stripe" ? "Stripe" : "PayPal"} Webhook
        </h3>
        <div className="space-y-4 rounded-lg border p-4">
          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Configuration</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select webhook configuration mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WEBHOOK_CONFIG_MODES.map((mode, i) => (
                      <SelectItem key={i} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose whether to configure webhooks automatically or
                  manually.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endpoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endpoint</FormLabel>
                <FormControl>
                  <Input
                    disabled
                    {...field}
                    value={
                      paymentProvider?.enabledProviders?.includes("stripe")
                        ? `${getBaseUrl()}/api/webhook/stripe`
                        : `${getBaseUrl()}/api/webhook/paypal`
                    }
                  />
                </FormControl>
                <FormDescription>
                  Copy this URL to your Stripe webhook settings
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="secret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secret</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="whsec_..."
                    {...field}
                    value={field.value ?? ""}
                    disabled={form.watch("mode") === "auto"}
                  />
                </FormControl>
                <FormDescription>
                  Used to verify webhook events from Stripe
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={
              currentProvider === "stripe" ? "stripeEvents" : "paypalEvents"
            }
            render={({ field }) => {
              const selectables = WEBHOOK_EVENTS.filter(
                (event): event is WebhookEvent =>
                  !field.value?.some((v) => v.value === event.value),
              );
              const isAutoMode = form.watch("mode") === "auto";

              return (
                <FormItem>
                  <FormLabel
                    onClick={() => {
                      if (!isAutoMode) {
                        setOpen(true);
                        inputRef.current?.focus();
                      }
                    }}
                  >
                    Webhook Events
                  </FormLabel>
                  <Command
                    onKeyDown={(e) => !isAutoMode && handleKeyDown(e, field)}
                    className="overflow-visible bg-transparent"
                  >
                    <div
                      className={`group rounded-md border px-3 py-2 text-sm shadow-xs ${isAutoMode ? "opacity-50" : "focus-within:border-white"}`}
                    >
                      <div className="flex flex-wrap gap-1">
                        {(field.value ?? []).map((event) => (
                          <Badge key={event.value} variant="secondary">
                            {event.label}
                            {!isAutoMode && (
                              <button
                                className="ring-offset-background focus:ring-ring ml-1 rounded-full outline-hidden focus:ring-2 focus:ring-offset-2"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const newValue =
                                      field.value?.filter(
                                        (v) => v.value !== event.value,
                                      ) ?? [];
                                    field.onChange(newValue);
                                  }
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={() => {
                                  const newValue =
                                    field.value?.filter(
                                      (v) => v.value !== event.value,
                                    ) ?? [];
                                  field.onChange(newValue);
                                }}
                              >
                                <X className="text-muted-foreground hover:text-foreground size-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                        <CommandPrimitive.Input
                          ref={inputRef}
                          value={inputValue}
                          onValueChange={setInputValue}
                          onBlur={() => setOpen(false)}
                          onFocus={() => !isAutoMode && setOpen(true)}
                          placeholder="Select events..."
                          className="placeholder:text-muted-foreground ml-2 flex-1 bg-transparent outline-hidden"
                          disabled={isAutoMode}
                        />
                      </div>
                    </div>
                    <div className="relative mt-2">
                      <CommandList>
                        {open && !isAutoMode && selectables.length > 0 ? (
                          <div className="bg-popover text-popover-foreground animate-in absolute top-0 z-10 w-full rounded-md border shadow-md outline-hidden">
                            <CommandGroup className="h-full overflow-auto">
                              {selectables.map((event) => (
                                <CommandItem
                                  key={event.value}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onSelect={() => {
                                    setInputValue("");
                                    field.onChange([
                                      ...(field.value ?? []),
                                      event,
                                    ]);
                                  }}
                                  className={"cursor-pointer"}
                                >
                                  {event.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </div>
                        ) : null}
                      </CommandList>
                    </div>
                  </Command>
                  <FormDescription>
                    Select the events you want to receive from Stripe.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
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
                {form.watch("mode") === "auto" ? "Creating..." : "Saving..."}
              </>
            ) : form.watch("mode") === "auto" ? (
              "Create webhook"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

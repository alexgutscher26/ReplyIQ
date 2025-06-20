"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { generateSecret } from "@/utils";
import {
  type AuthSettings,
  authSettingsSchema,
  SOCIAL_PROVIDERS,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function UpdateAuthSocialProviderForm() {
  const utils = api.useUtils();
  const [settings] = api.settings.socialAuth.useSuspenseQuery();
  const update = api.settings.updateSocialAuth.useMutation({
    onSuccess: async () => {
      toast.success("Success", {
        description:
          "Your social authentication settings have been saved successfully.",
      });

      await utils.settings.socialAuth.invalidate();
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

  const form = useForm<AuthSettings>({
    resolver: zodResolver(authSettingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const onSubmit = (data: AuthSettings) => {
    update.mutate(data);
  };

  const enabledProviders = form.watch("enabledProviders") ?? [];

  const handleGenerateSecret = useCallback(() => {
    const newSecret = generateSecret();
    form.setValue("secret", newSecret, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="mb-4 text-lg font-medium">Authentication</h3>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="secret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secret Key</FormLabel>
                <FormControl>
                  <Input {...field} type="password" />
                </FormControl>
                <FormDescription>
                  Random value used by the library for encryption and generating
                  hashes.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateSecret}
            disabled={update.isPending}
          >
            Generate new secret
          </Button>

          <FormField
            control={form.control}
            name="trustedOrigins"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trusted Origins</FormLabel>
                <div className="space-y-2">
                  {/* Show at least one input field even when array is empty */}
                  {(field.value?.length ? field.value : [""]).map(
                    (origin, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <FormControl>
                          <Input
                            value={origin}
                            onChange={(e) => {
                              const newOrigins = [...(field.value ?? [])];
                              newOrigins[index] = e.target.value;
                              field.onChange(newOrigins);
                            }}
                            placeholder="https://example.com"
                          />
                        </FormControl>
                        {field.value?.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newOrigins = field.value.filter(
                                (_, i) => i !== index,
                              );
                              field.onChange(newOrigins);
                            }}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    ),
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      field.onChange([...(field.value ?? []), ""]);
                    }}
                  >
                    Add Origin
                  </Button>
                </div>
                <FormDescription>
                  List of allowed origins that can authenticate with your app.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="enabledProviders"
              render={() => (
                <FormItem>
                  <FormLabel>Social Providers</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {SOCIAL_PROVIDERS.map((provider) => (
                      <FormField
                        key={provider}
                        control={form.control}
                        name="enabledProviders"
                        render={({ field }) => (
                          <FormItem
                            key={provider}
                            className="flex items-start space-y-0 space-x-3 rounded-md border p-4"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(provider)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, provider])
                                    : field.onChange(
                                        field.value?.filter(
                                          (v) => v !== provider,
                                        ),
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {provider.charAt(0).toUpperCase() +
                                provider.slice(1)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />
          </div>

          {enabledProviders?.length > 0 && (
            <div className="space-y-4">
              {enabledProviders.map((provider) => (
                <Collapsible key={provider} className="space-y-2">
                  <div className="space-y-2">
                    <CollapsibleTrigger className="hover:bg-muted flex w-full items-center justify-between rounded-lg border px-4 py-2 font-medium">
                      <span className="text-sm">
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}{" "}
                        Configuration
                      </span>
                      <ChevronDown className="size-4" />
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="space-y-4 rounded-md border px-4 py-3">
                        <FormField
                          control={form.control}
                          name={`providerCredentials.${provider}.clientId`}
                          defaultValue=""
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client ID</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`providerCredentials.${provider}.clientSecret`}
                          defaultValue=""
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client Secret</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          size="sm"
          variant={"outline"}
          disabled={
            update.isPending ||
            !form.formState.isValid ||
            !form.formState.isDirty
          }
        >
          {update.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </Form>
  );
}

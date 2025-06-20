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
import {
  type AuthSettings,
  authSettingsSchema,
  SOCIAL_PROVIDERS,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function UpdateAuthSocialProviderCardForm() {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="mb-4 text-lg font-medium">Social Authentication</h3>
        <div className="space-y-4">
          {SOCIAL_PROVIDERS.map((provider) => (
            <FormField
              key={provider}
              control={form.control}
              name="enabledProviders"
              render={({ field }) => (
                <FormItem className="border-border/50 flex flex-col space-y-4 rounded-lg border p-4">
                  <div className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </FormLabel>
                      <FormDescription>
                        Enable {provider} authentication
                      </FormDescription>
                      <FormMessage />
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value?.includes(provider)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...field.value, provider])
                            : field.onChange(
                                field.value?.filter((v) => v !== provider),
                              );
                        }}
                      />
                    </FormControl>
                  </div>

                  {enabledProviders?.includes(provider) && (
                    <div className="bg-muted/30 grid gap-4 rounded-md p-4 transition-all">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`providerCredentials.${provider}.clientId`}
                          defaultValue=""
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                Client ID
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="border-border/50 bg-background"
                                  placeholder="Enter client ID"
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                {provider.charAt(0).toUpperCase() +
                                  provider.slice(1)}{" "}
                                Client ID
                              </FormDescription>
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
                              <FormLabel className="text-sm font-medium">
                                Client Secret
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="border-border/50 bg-background"
                                  placeholder="Enter client secret"
                                  type="password"
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                {provider.charAt(0).toUpperCase() +
                                  provider.slice(1)}{" "}
                                Client Secret
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />
          ))}
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

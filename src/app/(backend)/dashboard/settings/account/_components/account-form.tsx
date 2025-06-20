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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import {
  type CustomPromptFormValues,
  customPromptSchema,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function AccountForm() {
  const { data: accountSettings, isLoading } = api.settings.account.useQuery();

  const updateAccount = api.settings.updateAccount.useMutation({
    onSuccess: () => {
      toast.success("Success", {
        description: "Your custom prompt has been saved.",
      });
    },
    onError: (error) => {
      toast.error("Uh oh! Something went wrong.", {
        description: error.message ?? "An error occurred",
        action: {
          label: "Try again",
          onClick: () => {
            updateAccount.mutate({
              ...accountSettings,
              customPrompt: form.getValues().customPrompt,
            });
          },
        },
      });
    },
  });

  const form = useForm<CustomPromptFormValues>({
    resolver: zodResolver(customPromptSchema),
    defaultValues: {
      customPrompt: "",
    },
  });

  // Update form when account settings load
  useEffect(() => {
    if (accountSettings) {
      form.reset({
        customPrompt: accountSettings.customPrompt,
      });
    }
  }, [form, accountSettings]);

  function onSubmit(data: CustomPromptFormValues) {
    updateAccount.mutate({
      ...accountSettings,
      ...data,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="customPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isLoading ? "animate-pulse" : ""}>
                Custom Prompt
              </FormLabel>
              <FormControl>
                <Textarea
                  className={`min-h-[100px] resize-y ${
                    isLoading ? "bg-muted animate-pulse" : ""
                  }`}
                  placeholder="Enter your prompt"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormDescription
                className={
                  isLoading ? "text-muted-foreground animate-pulse" : ""
                }
              >
                This will be your custom prompt to instruct the AI to generate
                responses.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size={"sm"}
          variant={"outline"}
          disabled={isLoading || updateAccount.isPending}
        >
          {updateAccount.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </Form>
  );
}

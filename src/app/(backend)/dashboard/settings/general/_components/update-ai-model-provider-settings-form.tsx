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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import {
  AI_MODEL_LIST,
  type AIModelProviderSettings,
  aiModelProviderSettingsSchema,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function UpdateAiModelProviderSettingsForm() {
  const utils = api.useUtils();
  const [settings] = api.settings.aiModel.useSuspenseQuery();
  const update = api.settings.updateAiModel.useMutation({
    onSuccess: async () => {
      toast.success("Success", {
        description: "Your AI model provider settings have been saved.",
      });

      await utils.settings.aiModel.invalidate();
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

  const form = useForm<AIModelProviderSettings>({
    resolver: zodResolver(aiModelProviderSettingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [form, settings]);

  async function onSubmit(data: AIModelProviderSettings) {
    update.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="mb-4 text-lg font-medium">AI Model Settings</h3>
        <div className="space-y-4 rounded-lg border p-4">
          <FormField
            control={form.control}
            name="enabledModels"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AI Model</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange([value])}
                  value={field.value?.[0]}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI Model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AI_MODEL_LIST.map((model, i) => (
                      <SelectItem key={i} value={model.key}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Select an AI model to enable</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter API key for the selected model"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter the API key for{" "}
                  {
                    AI_MODEL_LIST.find(
                      (m) => m.key === form.watch("enabledModels")[0],
                    )?.name
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="systemPrompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>System Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter system prompt instructions..."
                    className="min-h-[100px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Define the default system prompt for the AI model
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
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
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import {
  AI_MODEL_LIST,
  type AIModelProviderSettings,
  aiModelProviderSettingsSchema,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

/**
 * Form component for updating AI model provider settings.
 *
 * This function handles the form logic for updating AI model provider settings, including fetching current settings,
 * handling form submissions, and displaying success or error notifications. It manages human-like options conditionally
 * based on the selected AI model.
 *
 * @returns A React functional component rendering the settings update form.
 */
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
    defaultValues: {
      ...settings,
      // Initialize with default human-like options if none exist
      humanLikeOptions: settings?.humanLikeOptions ?? {
        temperature: 0.8,
        topP: 0.9,
        addFillerWords: true,
        addGrammaticalVariations: true,
        addPauses: true
      }
    }
  });

  async function onSubmit(data: AIModelProviderSettings) {
    update.mutate(data);
  }

  const selectedModel = AI_MODEL_LIST.find(
    (model) => model.key === form.watch("enabledModels")?.[0]
  );
  const isHumanLike = selectedModel?.provider === "human-like";

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
                  value={field.value?.[0] ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select AI Model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AI_MODEL_LIST.map((model) => (
                      <SelectItem key={model.key} value={model.key}>
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          {model.provider === "human-like" && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              Human-like
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
                {isHumanLike && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Human-like models add natural variations to make AI responses more human-sounding.
                  </p>
                )}
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

          {isHumanLike && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="text-sm font-medium text-primary">Human-like Settings</h4>
              <FormField
                control={form.control}
                name="humanLikeOptions.temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature: {field.value}</FormLabel>
                    <FormControl>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Controls randomness (0 = deterministic, 1 = more creative)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="humanLikeOptions.addFillerWords"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Add Filler Words</FormLabel>
                        <FormDescription>
                          Include natural-sounding filler words
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="humanLikeOptions.addGrammaticalVariations"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Add Grammatical Variations</FormLabel>
                        <FormDescription>
                          Vary sentence structure naturally
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="humanLikeOptions.addPauses"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Add Natural Pauses</FormLabel>
                        <FormDescription>
                          Include natural pauses in responses
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

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

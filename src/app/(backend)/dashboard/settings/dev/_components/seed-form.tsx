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
import { api } from "@/trpc/react";
import { devFormSchema, type DevFormValues } from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function SeedGeneralForm() {
  const utils = api.useUtils();

  const reset = api.settings.reset.useMutation({
    onSuccess: async () => {
      // Force refetch
      await utils.settings.general.refetch();

      toast.success("Success", {
        description: "Database has been reset successfully.",
      });
    },
    onError: (error) => {
      toast.error("Uh oh! Something went wrong.", {
        description:
          error.message || "Failed to reset database. Please try again.",
        action: {
          label: "Try again",
          onClick: () => {
            reset.mutate();
          },
        },
      });
    },
  });

  const seed = api.settings.seed.useMutation({
    onSuccess: async () => {
      // Force refetch
      await utils.settings.general.refetch();

      toast.success("Success", {
        description: "Database has been seeded successfully.",
      });
    },
    onError: (error) => {
      toast.error("Uh oh! Something went wrong.", {
        description:
          error.message || "Failed to seed database. Please try again.",
        action: {
          label: "Try again",
          onClick: () => {
            seed.mutate();
          },
        },
      });
    },
  });

  const cleanupAIModels = api.settings.cleanupInvalidAIModels.useMutation({
    onSuccess: async (data) => {
      // Force refetch
      await utils.settings.general.refetch();

      toast.success("Success", {
        description: data.message,
      });
    },
    onError: (error) => {
      toast.error("Uh oh! Something went wrong.", {
        description:
          error.message || "Failed to cleanup AI models. Please try again.",
        action: {
          label: "Try again",
          onClick: () => {
            cleanupAIModels.mutate();
          },
        },
      });
    },
  });

  const form = useForm<DevFormValues>({
    resolver: zodResolver(devFormSchema),
  });

  async function handleReset() {
    reset.mutate();
  }

  async function handleSeed() {
    seed.mutate();
  }

  async function handleCleanupAIModels() {
    cleanupAIModels.mutate();
  }

  const isLoading = reset.isPending || seed.isPending || cleanupAIModels.isPending;

  return (
    <Form {...form}>
      <form className="space-y-8">
        <FormField
          control={form.control}
          name="reset"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>Resetter</FormLabel>
              <FormControl>
                <Button
                  type="button"
                  variant="outline"
                  size={"sm"}
                  className="w-fit"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  {reset.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Reset settings"
                  )}
                </Button>
              </FormControl>
              <FormDescription>
                Reset the user database to its initial state.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="seed"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>Seeder</FormLabel>
              <FormControl>
                <Button
                  type="button"
                  variant="outline"
                  size={"sm"}
                  className="w-fit"
                  onClick={handleSeed}
                  disabled={isLoading}
                >
                  {seed.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Seed settings"
                  )}
                </Button>
              </FormControl>
              <FormDescription>
                Seed the user database with dummy data.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="seed"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>AI Model Cleanup</FormLabel>
              <FormControl>
                <Button
                  type="button"
                  variant="outline"
                  size={"sm"}
                  className="w-fit"
                  onClick={handleCleanupAIModels}
                  disabled={isLoading}
                >
                  {cleanupAIModels.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Cleanup Invalid AI Models"
                  )}
                </Button>
              </FormControl>
              <FormDescription>
                Remove invalid AI models and replace with valid defaults.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

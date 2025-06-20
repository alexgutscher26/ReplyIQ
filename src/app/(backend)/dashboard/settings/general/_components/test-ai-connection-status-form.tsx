"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  type TestConnectionResult,
  testConnectionSchema,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function TestAiConnectionStatusForm() {
  const testConnection = api.settings.testAiConnection.useMutation({
    onSuccess: (data) => {
      toast.error(data.success ? "Success" : "Failed", {
        description:
          data.message || "Failed to test connection. Please try again.",
        action: data.success
          ? undefined
          : {
              label: "Try again",
              onClick: () => testConnection.mutate(form.getValues()),
            },
      });
    },
    onError: (error) => {
      toast.error("Uh oh! Something went wrong.", {
        description:
          error.message || "Failed to test connection. Please try again.",
        action: {
          label: "Try again",
          onClick: () => testConnection.mutate(form.getValues()),
        },
      });
    },
  });

  const form = useForm<TestConnectionResult>({
    resolver: zodResolver(testConnectionSchema),
  });

  const onSubmit = async (data: TestConnectionResult) => {
    testConnection.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <h3 className="mb-4 text-lg font-medium">Test Provider Connection</h3>
        <FormField
          control={form.control}
          name="success"
          render={() => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">AI Model</FormLabel>
                <div className="flex items-center gap-2">
                  <FormDescription>
                    Test the connection to your AI provider.
                  </FormDescription>
                  <Dialog>
                    {testConnection.data && (
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-4"
                        >
                          <Info />
                        </Button>
                      </DialogTrigger>
                    )}
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Connection Test Logs</DialogTitle>
                      </DialogHeader>
                      <Textarea
                        readOnly
                        rows={7}
                        className="font-mono"
                        value={testConnection?.data?.logs.join("\n")}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                <FormMessage />
              </div>

              <FormControl>
                <Button
                  type="submit"
                  size="sm"
                  variant={"outline"}
                  disabled={testConnection.isPending}
                >
                  {testConnection.isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

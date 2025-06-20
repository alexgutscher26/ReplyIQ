"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { api } from "@/trpc/react";
import Link from "next/link";
import { useForm } from "react-hook-form";

export default function DownloadExtensionForm() {
  const form = useForm();
  const [download] = api.settings.downloadExtension.useSuspenseQuery();

  return (
    <Form {...form}>
      <form className="space-y-3">
        <h3 className="mb-4 text-lg font-medium">Download extensions</h3>
        <FormField
          control={form.control}
          name="chrome"
          render={() => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Chrome</FormLabel>
                <FormDescription>
                  Download the Replier browser extension for Chrome.
                </FormDescription>
              </div>
              <FormControl>
                <Button type="button" variant="secondary" size="sm" asChild>
                  <Link href={download.chrome! ?? "#"} target="_blank">
                    Download
                  </Link>
                </Button>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="firefox"
          render={() => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Firefox</FormLabel>
                <FormDescription>
                  Download the Replier browser extension for Firefox.
                </FormDescription>
              </div>
              <FormControl>
                <Button type="button" variant="secondary" size="sm" asChild>
                  <Link href={download.firefox! ?? "#"} target="_blank">
                    Download
                  </Link>
                </Button>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

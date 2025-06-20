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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "next-themes";
import { useEffect } from "react";

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme.",
  }),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

// This can come from your database or API.
const defaultValues: Partial<AppearanceFormValues> = {
  theme: "system",
};

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: (theme as AppearanceFormValues["theme"]) || defaultValues.theme,
    },
  });

  // Update form value when theme changes
  useEffect(() => {
    if (theme) {
      form.setValue("theme", theme as AppearanceFormValues["theme"]);
    }
  }, [theme, form]);

  function onSubmit(data: AppearanceFormValues) {
    setTheme(data.theme);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Theme</FormLabel>
              <FormDescription>
                Select the theme for the dashboard.
              </FormDescription>
              <FormMessage />
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid max-w-md grid-cols-3 gap-4 pt-2"
              >
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="light" className="sr-only" />
                    </FormControl>
                    <div className="border-muted hover:border-accent space-y-2 rounded-md border-2 px-3 py-2">
                      <div className="bg-primary/20 h-2 w-8 rounded-full" />
                      <div className="bg-muted h-2 w-12 rounded-full" />
                      <span className="block pt-1 text-center text-sm font-normal">
                        Light
                      </span>
                    </div>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="dark" className="sr-only" />
                    </FormControl>
                    <div className="border-muted hover:border-accent space-y-2 rounded-md border-2 bg-slate-950 px-3 py-2">
                      <div className="bg-primary/20 h-2 w-8 rounded-full" />
                      <div className="bg-muted h-2 w-12 rounded-full" />
                      <span className="block pt-1 text-center text-sm font-normal">
                        Dark
                      </span>
                    </div>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="system" className="sr-only" />
                    </FormControl>
                    <div className="border-muted hover:border-accent space-y-2 rounded-md border-2 px-3 py-2">
                      <div className="from-primary/20 h-2 w-8 rounded-full bg-linear-to-r to-slate-950" />
                      <div className="bg-muted h-2 w-12 rounded-full" />
                      <span className="block pt-1 text-center text-sm font-normal">
                        System
                      </span>
                    </div>
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />

        <Button type="submit" size={"sm"} variant={"outline"}>
          Update preferences
        </Button>
      </form>
    </Form>
  );
}

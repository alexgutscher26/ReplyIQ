"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import {
  contactFormSchema,
  type ContactFormValues,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function ContactSection() {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const sendContactMail = api.settings.sendContactMail.useMutation({
    onSuccess: () => {
      toast.success("Message sent", {
        description: "We'll get back to you as soon as possible.",
      });

      form.reset();
    },
    onError: () => {
      toast.error("Uh oh! Something went wrong.", {
        description: "Failed to send message. Please try again.",
        action: {
          label: "Try again",
          onClick: () => sendContactMail.mutate(form.getValues()),
        },
      });
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    sendContactMail.mutate(data);
  };

  return (
    <section className="py-32">
      <div className="mx-auto max-w-3xl px-8 lg:px-0">
        <h1 className="text-center text-4xl font-semibold lg:text-5xl">
          Contact Sales
        </h1>
        <p className="mt-4 text-center">
          We&apos;ll help you find the right plan and pricing for your business.
        </p>

        <Card className="mx-auto mt-12 max-w-lg p-8 shadow-md sm:p-16">
          <div>
            <h2 className="text-xl font-semibold">
              Let&apos;s get you to the right place
            </h2>
            <p className="mt-4 text-sm">
              Reach out to our sales team! We’re eager to learn more about how
              you plan to use our application.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-12 space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        disabled={sendContactMail.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        {...field}
                        disabled={sendContactMail.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="How can we help you?"
                        {...field}
                        disabled={sendContactMail.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your needs..."
                        rows={3}
                        {...field}
                        disabled={sendContactMail.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={sendContactMail.isPending}>
                {sendContactMail.isPending ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </section>
  );
}

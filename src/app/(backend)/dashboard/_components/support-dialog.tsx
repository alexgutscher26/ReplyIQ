"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  supportFormSchema,
  type SupportFormValues,
} from "@/utils/schema/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface SupportDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SupportDialog({
  open,
  onOpenChange,
}: SupportDialogProps) {
  const mail = api.settings.sendSupportMail.useMutation({
    onSuccess: () => {
      toast.success("Support request sent", {
        description: "We'll get back to you as soon as possible.",
      });

      form.reset();
      onOpenChange?.(false);
    },
    onError: () => {
      toast.error("Uh oh! Something went wrong.", {
        description: "Failed to send support request. Please try again.",
        action: {
          label: "Try again",
          onClick: () => mail.mutate(form.getValues()),
        },
      });
    },
  });

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (formData: SupportFormValues) => {
    mail.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Support Request</DialogTitle>
          <DialogDescription>
            Need help? Send us a message and we&apos;ll get back to you as soon
            as possible.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of your issue"
                      {...field}
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
                      placeholder="Describe your issue in detail"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                size={"sm"}
                variant={"outline"}
                disabled={mail.isPending || form.formState.isSubmitting}
              >
                {mail.isPending || form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send message"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

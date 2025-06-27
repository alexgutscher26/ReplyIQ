"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/hooks/use-auth-hooks";
import { api } from "@/trpc/react";
import {
  supportFormSchema,
  type SupportFormValues,
} from "@/utils/schema/settings";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Send,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Zap,
  AlertTriangle,
  Info,
  User,
  Mail,
  MessageSquare,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

interface SupportDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Pre-fill the subject field */
  defaultSubject?: string;
  /** Pre-fill the message field */
  defaultMessage?: string;
  /** Support request priority */
  defaultPriority?: "low" | "medium" | "high" | "urgent";
  /** Support category */
  defaultCategory?: string;
}

// Support categories with icons and descriptions
const SUPPORT_CATEGORIES = [
  {
    value: "general",
    label: "General Question",
    icon: HelpCircle,
    description: "General inquiries and questions",
  },
  {
    value: "technical",
    label: "Technical Issue",
    icon: AlertTriangle,
    description: "Bug reports and technical problems",
  },
  {
    value: "billing",
    label: "Billing & Account",
    icon: User,
    description: "Payment and account related issues",
  },
  {
    value: "feature",
    label: "Feature Request",
    icon: Zap,
    description: "Suggestions for new features",
  },
  {
    value: "urgent",
    label: "Urgent Issue",
    icon: AlertCircle,
    description: "Critical problems requiring immediate attention",
  },
] as const;

// Priority levels with styling
const PRIORITY_LEVELS = [
  {
    value: "low",
    label: "Low",
    description: "Non-urgent, general inquiry",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Standard support request",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    value: "high",
    label: "High",
    description: "Important issue affecting workflow",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    value: "urgent",
    label: "Urgent",
    description: "Critical issue requiring immediate attention",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
] as const;

const SupportDialog = memo(function SupportDialog({
  open,
  onOpenChange,
  defaultSubject = "",
  defaultMessage = "",
  defaultPriority = "medium",
  defaultCategory = "general",
}: SupportDialogProps) {
  const { user } = useSession();
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [selectedPriority, setSelectedPriority] = useState(defaultPriority);
  const [charCount, setCharCount] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Enhanced mutation with better error handling
  const mail = api.settings.sendSupportMail.useMutation({
    onSuccess: () => {
      toast.success("Support request sent successfully!", {
        description: "We'll get back to you within 24 hours.",
        icon: <CheckCircle2 className="size-4 text-green-500" />,
      });

      form.reset();
      setSelectedCategory("general");
      setSelectedPriority("medium");
      setCharCount(0);
      onOpenChange?.(false);
    },
    onError: (error) => {
      const errorMessage = error?.message || "Failed to send support request";
      toast.error("Failed to send support request", {
        description: errorMessage,
        icon: <AlertCircle className="size-4 text-destructive" />,
        action: {
          label: "Retry",
          onClick: () => mail.mutate(form.getValues()),
        },
      });
    },
  });

  // Enhanced form with additional fields
  const form = useForm<SupportFormValues & { category?: string; priority?: string }>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      subject: defaultSubject,
      message: defaultMessage,
      category: defaultCategory,
      priority: defaultPriority,
    },
  });

  // Watch message field for character count
  const messageValue = form.watch("message");
  
  useEffect(() => {
    setCharCount(messageValue?.length || 0);
  }, [messageValue]);

  // Auto-save draft functionality (simulation)
  const autoSaveDraft = useCallback(() => {
    const formValues = form.getValues();
    if (formValues.subject || formValues.message) {
      setIsAutoSaving(true);
      // Simulate auto-save
      setTimeout(() => {
        setIsAutoSaving(false);
      }, 1000);
    }
  }, [form]);

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      const timer = setTimeout(autoSaveDraft, 2000);
      return () => clearTimeout(timer);
    });
    return () => subscription.unsubscribe();
  }, [form, autoSaveDraft]);

  // Get selected category info
  const categoryInfo = useMemo(() => {
    return SUPPORT_CATEGORIES.find(cat => cat.value === selectedCategory);
  }, [selectedCategory]);

  // Get selected priority info
  const priorityInfo = useMemo(() => {
    return PRIORITY_LEVELS.find(priority => priority.value === selectedPriority);
  }, [selectedPriority]);

  const onSubmit = useCallback(async (formData: SupportFormValues) => {
    // Add category and priority to the request
    const enhancedData = {
      ...formData,
      category: selectedCategory,
      priority: selectedPriority,
      userInfo: {
        name: user?.name,
        email: user?.email,
        role: user?.role,
      },
    };
    
    mail.mutate(enhancedData);
  }, [mail, selectedCategory, selectedPriority, user]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedCategory(defaultCategory);
      setSelectedPriority(defaultPriority);
      setCharCount(0);
    }
  }, [open, form, defaultCategory, defaultPriority]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Contact Support</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Get help from our support team. We typically respond within 24 hours.
              </DialogDescription>
            </div>
          </div>
          
          {/* User Info Display */}
          {user && (
            <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
              <div className="p-1.5 rounded-full bg-primary/10">
                <User className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              {user.role && (
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        <Separator className="my-4" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Category and Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORT_CATEGORIES.map((category) => (
                      <SelectItem
                        key={category.value}
                        value={category.value}
                        className="flex items-center gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <category.icon className="size-4" />
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoryInfo && (
                  <p className="text-xs text-muted-foreground">
                    {categoryInfo.description}
                  </p>
                )}
              </div>

              {/* Priority Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={selectedPriority}
                  onValueChange={(value) => setSelectedPriority(value as typeof selectedPriority)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_LEVELS.map((priority) => (
                      <SelectItem
                        key={priority.value}
                        value={priority.value}
                        className="flex items-center gap-2"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{priority.label}</span>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", priority.color)}
                          >
                            {priority.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {priorityInfo && (
                  <p className="text-xs text-muted-foreground">
                    {priorityInfo.description}
                  </p>
                )}
              </div>
            </div>

            {/* Subject Field */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="size-4" />
                    Subject
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of your issue"
                      className="transition-all duration-200 focus:ring-2"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Provide a clear, concise subject line for your request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message Field */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-4" />
                      Message
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {isAutoSaving && (
                        <>
                          <Loader2 className="size-3 animate-spin" />
                          <span>Auto-saving...</span>
                        </>
                      )}
                      <span>{charCount}/1000</span>
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, or relevant context."
                      className="min-h-[150px] transition-all duration-200 focus:ring-2 resize-none"
                      maxLength={1000}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    The more details you provide, the better we can help you
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Help Text Section */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                    Tips for faster resolution
                  </h4>
                                     <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1">
                     <li>• Include specific error messages or screenshots if applicable</li>
                     <li>• Describe the steps you took before the issue occurred</li>
                     <li>• Mention your browser/device if it&apos;s a technical issue</li>
                     <li>• For urgent issues, include your contact information</li>
                   </ul>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange?.(false)}
                disabled={mail.isPending}
                className="order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={mail.isPending || form.formState.isSubmitting || !form.formState.isValid}
                className={cn(
                  "order-1 sm:order-2 transition-all duration-200",
                  priorityInfo?.value === "urgent" && "bg-red-600 hover:bg-red-700"
                )}
              >
                {mail.isPending || form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Send Support Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

SupportDialog.displayName = "SupportDialog";

export default SupportDialog;

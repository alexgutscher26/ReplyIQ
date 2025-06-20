"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { api } from "@/trpc/react";
import {
  siteSettingsFormSchema,
  type SiteSettingsFormValues,
} from "@/utils/schema/settings";
import { useUploadThing } from "@/utils/uploadthing";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function UpdateSiteSettingsForm() {
  const utils = api.useUtils();
  const [settings] = api.settings.site.useSuspenseQuery();
  const update = api.settings.updateSite.useMutation({
    onSuccess: async () => {
      toast.success("Success", {
        description: "Your site settings have been saved successfully.",
      });

      await utils.settings.site.invalidate();
    },
    onError: (error) => {
      toast.error("Uh oh! Something went wrong.", {
        description:
          error.message || "Failed to update settings. Please try again.",
        action: {
          label: "Try again",
          onClick: () => {
            const data = form.getValues();
            update.mutate({
              ...data,
              logo: typeof data.logo === "string" ? data.logo : undefined,
            });
          },
        },
      });
    },
  });

  const [image, setImage] = useState<string>("");

  const { isUploading, startUpload } = useUploadThing(
    (routeRegistry) => routeRegistry.imageUploader,
  );

  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsFormSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name ?? "",
        title: settings.title ?? "",
        logo: settings.logo ?? "",
      });

      setImage(settings.logo ?? "");
    }
  }, [form, settings]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      form.setValue("logo", e.target.files!, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };

      reader.readAsDataURL(file);
    } else {
      setImage("");
      form.setValue("logo", "", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  async function onSubmit(data: SiteSettingsFormValues) {
    let logoUrl: string | undefined = undefined;

    if (data.logo instanceof FileList && data.logo[0]) {
      const file = data.logo[0];
      const upload = await startUpload([file]);

      if (upload?.[0]) {
        logoUrl = upload[0].url;
      }
    }

    // update.mutate({ ...data, logo: logoUrl });
    update.mutate({
      ...data,
      logo: logoUrl ?? (typeof data.logo === "string" ? data.logo : undefined),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="text-sm leading-none font-medium">Site Information</h3>
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-center">
            <Avatar className="size-16 shrink-0 rounded-lg">
              <AvatarImage
                src={image ?? undefined}
                alt="Logo preview"
                className="object-cover"
              />
              <AvatarFallback className="rounded-lg">LOGO</AvatarFallback>
            </Avatar>
          </div>
          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                    onChange={handleImageChange}
                    ref={field.ref}
                    name={field.name}
                  />
                </FormControl>
                <FormDescription>
                  JPG, GIF, PNG or WebP. SVG preferred. 4MB max.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...field} />
                </FormControl>
                <FormDescription>
                  Your full name or nickname that will be displayed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Your Site Title" {...field} />
                </FormControl>
                <FormDescription>
                  Your site title that will be displayed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size={"sm"}
            variant={"outline"}
            disabled={
              isUploading ||
              update.isPending ||
              !form.formState.isValid ||
              !form.formState.isDirty
            }
          >
            {isUploading || update.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

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
import { useSession } from "@/hooks/use-auth-hooks";
import { authClient } from "@/server/auth/client";
import {
  updateUserSettingsFormSchema,
  type UpdateUserSettingsFormValues,
} from "@/utils/schema/settings";
import { useUploadThing } from "@/utils/uploadthing";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function UpdateUserProfileSettingsForm() {
  const { user, isPending, refetch, isError, error } = useSession();
  const [image, setImage] = useState<string>("");

  const { isUploading, startUpload } = useUploadThing(
    (routeRegistry) => routeRegistry.imageUploader,
  );

  const form = useForm<UpdateUserSettingsFormValues>({
    resolver: zodResolver(updateUserSettingsFormSchema),
    defaultValues: {
      avatar: "",
      name: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        avatar: user.image ?? "",
        name: user.name ?? "",
      });
      setImage(user.image ?? "");
    }
  }, [user, form]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      form.setValue("avatar", e.target.files!, {
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
      form.setValue("avatar", undefined, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  async function onSubmit(data: UpdateUserSettingsFormValues) {
    let avatarUrl: string | undefined = undefined;

    if (data.avatar instanceof FileList && data.avatar[0]) {
      const file = data.avatar[0];
      const upload = await startUpload([file]);

      if (upload?.[0]) {
        avatarUrl = upload[0].url;
      }
    }

    await authClient.updateUser({
      name: data.name,
      ...(avatarUrl && { image: avatarUrl }),
      fetchOptions: {
        onError: ({ error }) => {
          toast.error("Uh oh! Something went wrong.", {
            description:
              error.message || "Failed to update settings. Please try again.",
            action: {
              label: "Try again",
              onClick: () => {
                void onSubmit(data);
              },
            },
          });
        },
        onSuccess: async () => {
          toast.success("Profile updated", {
            description: "Your profile has been updated successfully.",
          });

          await refetch();
        },
      },
    });
  }

  if (isPending || !user)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (isError)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-red-500">{error?.message}</p>
      </div>
    );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h3 className="text-sm leading-none font-medium">
          Update avatar and name
        </h3>
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
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    ref={field.ref}
                    name={field.name}
                  />
                </FormControl>
                <FormDescription>
                  JPG, GIF, PNG or WebP. 4MB max.
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

          <Button
            type="submit"
            size={"sm"}
            variant={"outline"}
            disabled={
              isUploading ||
              !form.formState.isValid ||
              !form.formState.isDirty ||
              form.formState.isSubmitting
            }
          >
            {isUploading || form.formState.isSubmitting ? (
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

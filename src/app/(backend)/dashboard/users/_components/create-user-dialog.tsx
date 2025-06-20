"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/server/auth/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    await authClient.admin.createUser({
      name: data.name as string,
      email: data.email as string,
      password: data.password as string,
      role: data.role as string,
      data: {
        source: "dashboard",
      },
      fetchOptions: {
        onResponse: () => setIsPending(false),
        onRequest: () => setIsPending(true),
        onError: (ctx) => {
          toast.error("Uh oh! Something went wrong.", {
            description: ctx.error.message ?? "Failed to create user.",
            action: {
              label: "Try again",
              onClick: () => {
                void authClient.admin.createUser({
                  name: data.name as string,
                  email: data.email as string,
                  password: data.password as string,
                  role: data.role as string,
                  data: {
                    source: "dashboard",
                  },
                  fetchOptions: {
                    onResponse: () => setIsPending(false),
                    onRequest: () => setIsPending(true),
                  },
                });
              },
            },
          });
        },
        onSuccess: async () => {
          toast.success("Success", {
            description: "User created successfully",
          });

          void queryClient.invalidateQueries({ queryKey: ["users"] });
          setOpen(false);
        },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={"sm"}>
          <PlusCircle />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-screen overflow-y-scroll sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Create a new user by filling out the form below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select name="role" required>
                <SelectTrigger className="col-span-3" id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { type ActionMenuProps } from "@/app/(backend)/dashboard/users/_components/action-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-auth-hooks";
import { authClient } from "@/server/auth/client";
import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ImpersonateUserAction<TData>({
  users,
}: ActionMenuProps<TData>) {
  const [isPending, setIsPending] = useState(false);
  const { user } = useSession();
  const router = useRouter();

  const handleSubmit = async () => {
    await authClient.admin.impersonateUser({
      userId: users[0]?.id ?? "",
      fetchOptions: {
        onResponse: () => setIsPending(false),
        onRequest: () => setIsPending(true),
        onError: (ctx) => {
          toast.error("Uh oh! Something went wrong.", {
            description: ctx.error.message ?? "Failed to impersonate user.",
            action: {
              label: "Try again",
              onClick: () => {
                void handleSubmit();
              },
            },
          });
        },
        onSuccess: async () => {
          toast.success("Impersonation successful", {
            description: `You are now impersonating ${users[0]?.email}.`,
          });

          router.push("/dashboard");
        },
      },
    });
  };

  return (
    <>
      <DropdownMenuItem
        disabled={
          isPending ||
          users.length !== 1 ||
          users[0]?.id === user?.id ||
          (users[0]?.banned ?? false)
        }
        onSelect={() => handleSubmit()}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
        Impersonate user
      </DropdownMenuItem>
    </>
  );
}

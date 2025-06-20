"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NavLogout() {
  const router = useRouter();

  const handleClick = async () => {
    router.push("/auth/sign-out");
  };

  return (
    <DropdownMenuItem onSelect={handleClick}>
      <LogOut />
      Log out
    </DropdownMenuItem>
  );
}

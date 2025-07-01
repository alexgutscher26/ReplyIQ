import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ComponentPropsWithoutRef } from "react";
import SupportDialog from "./support-dialog";

export default function NavSecondary({
  items,
  mini = false,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    dialog?: boolean;
  }[];
  mini?: boolean;
} & ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
      <SidebarGroup {...props}>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.dialog ? (
                  <SidebarMenuButton
                    size="sm"
                    onClick={() => setSupportOpen(true)}
                  >
                    <item.icon />
                    {!mini && <span>{item.title}</span>}
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton asChild size="sm">
                    <Link href={item.url}>
                      <item.icon />
                      {!mini && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </>
  );
}

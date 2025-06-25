"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "@/hooks/use-auth-hooks";
import { api } from "@/trpc/react";
import {
  ChartArea,
  Command,
  FileChartLine,
  LayoutDashboard,
  LifeBuoy,
  PieChart,
  Settings2,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { type ComponentProps } from "react";
import NavMain from "./nav-main";
import NavSecondary from "./nav-secondary";
import NavUser from "./nav-user";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Hashtag Generator",
      url: "/dashboard/hashtag-generator",
      icon: Command,
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: ChartArea,
      requireAdmin: true,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: FileChartLine,
      requireAdmin: true,
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: PieChart,
      requireAdmin: true,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: Users2,
      requireAdmin: true,
    },
    {
      title: "Settings",
      url: "/dashboard/settings/account",
      icon: Settings2,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "support",
      icon: LifeBuoy,
      dialog: true,
    },
  ],
};

export default function AppSidebar({
  ...props
}: ComponentProps<typeof Sidebar>) {
  const { user } = useSession();
  const { data: usage } = api.usage.getTotalUsage.useQuery({});

  return (
    <Sidebar variant="inset" className="border-r-2" {...props}>
      <SidebarHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-accent/50">
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">AI Replier</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {usage?.total ? `${usage.total} generations` : "Loading..."}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 sm:px-3">
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t px-2 py-2 sm:px-3 sm:py-3">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

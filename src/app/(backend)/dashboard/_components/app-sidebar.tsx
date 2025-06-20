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
  const [siteSettings] = api.settings.site.useSuspenseQuery();
  const [currentPlan] = api.payments.getCurrentBilling.useSuspenseQuery();

  const filteredNavMain = data.navMain.filter(
    (item) => !item.requireAdmin || user?.role === "admin",
  );

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Avatar className="h-8 w-8 shrink-0 rounded-none">
                    <AvatarImage
                      src={siteSettings?.logo ?? undefined}
                      alt="Logo preview"
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-lg">
                      <Command className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {siteSettings.name ?? "Replier Social"}
                  </span>
                  <span className="truncate text-xs">
                    {currentPlan?.product?.name ?? "Free"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

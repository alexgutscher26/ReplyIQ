import { SidebarNav } from "@/app/(backend)/dashboard/settings/_components/sidebar-nav";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/server/utils";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
};

const sidebarNavItems = [
  {
    title: "Account",
    href: "/dashboard/settings/account",
  },
  {
    title: "Profile",
    href: "/dashboard/settings/profile",
  },
  {
    title: "General",
    href: "/dashboard/settings/general",
    requireAdmin: true,
  },
  {
    title: "Appearance",
    href: "/dashboard/settings/appearance",
  },
  {
    title: "Developer",
    href: "/dashboard/settings/dev",
    requireAdmin: true,
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  const session = await getSession();

  const filteredSidebarNavItems = sidebarNavItems.filter(
    (item) => !item.requireAdmin || session?.user?.role === "admin",
  );

  return (
    <div className="space-y-4 p-4 pb-16 sm:space-y-6 sm:p-6 lg:p-10 md:block">
      <div className="space-y-1 sm:space-y-0.5">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Settings</h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      
      <Separator className="my-4 sm:my-6" />
      
      <div className="flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-12">
        <aside className="w-full lg:w-1/5">
          <div className="sticky top-4">
            <SidebarNav items={filteredSidebarNavItems} />
          </div>
        </aside>
        
        <div className="flex-1 min-w-0 lg:max-w-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}

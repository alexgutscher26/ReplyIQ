import { SidebarNav } from "@/app/(backend)/dashboard/settings/_components/sidebar-nav";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/server/utils";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Forms",
  description: "Advanced form example using react-hook-form and Zod.",
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
    <>
      <div className="space-y-6 p-10 pb-16 md:block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and set e-mail preferences.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
          <aside className="lg:w-1/5">
            <SidebarNav items={filteredSidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  );
}

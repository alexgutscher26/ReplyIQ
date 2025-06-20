import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AuthLoading,
  RedirectToSignIn,
  SignedIn,
} from "@daveyplate/better-auth-ui";
import { type ReactNode } from "react";
import AppSidebar from "./_components/app-sidebar";
import AppSidebarSkeleton from "./_components/app-sidebar-skeleton";
import BreadcrumbMenu from "./_components/breadcrumb-menu";
import BreadcrumbMenuSkeleton from "./_components/breadcrumb-menu-skeleton";
import DashboardSkeleton from "./_components/dashboard-skeleton";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <AuthLoading>
        <SidebarProvider>
          <AppSidebarSkeleton />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <Skeleton className="size-7 rounded-md" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <BreadcrumbMenuSkeleton />
              </div>
            </header>
            <DashboardSkeleton />
          </SidebarInset>
        </SidebarProvider>
      </AuthLoading>

      <RedirectToSignIn />

      <SignedIn>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <BreadcrumbMenu />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>
    </>
  );
}

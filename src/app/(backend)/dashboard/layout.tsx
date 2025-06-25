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
            <header className="flex h-14 shrink-0 items-center gap-2 sm:h-16">
              <div className="flex items-center gap-2 px-3 sm:px-4">
                <Skeleton className="size-6 rounded-md sm:size-7" />
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
            <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:h-16">
              <div className="flex items-center gap-2 px-3 sm:px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <BreadcrumbMenu />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-3 p-3 pt-0 sm:gap-4 sm:p-4 sm:pt-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>
    </>
  );
}

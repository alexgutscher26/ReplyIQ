import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { type ComponentProps, memo } from "react";
import { cn } from "@/lib/utils";

interface AppSidebarSkeletonProps extends ComponentProps<typeof Sidebar> {
  /** Number of menu items to show in skeleton */
  menuItemsCount?: number;
  /** Whether to show the footer section */
  showFooter?: boolean;
  /** Loading state variant */
  skeletonVariant?: "default" | "compact" | "detailed";
}

const AppSidebarSkeleton = memo(function AppSidebarSkeleton({
  menuItemsCount = 4,
  showFooter = true,
  skeletonVariant = "default",
  className,
  ...props
}: AppSidebarSkeletonProps) {
  // Different menu item widths for more realistic loading appearance
  const menuItemWidths = ["w-20", "w-24", "w-16", "w-28", "w-18", "w-22"];
  
  const getSkeletonAnimation = () => {
    return "animate-pulse transition-all duration-300 ease-in-out";
  };

  const renderHeader = () => (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default">
            <div className="flex aspect-square size-8 items-center justify-center">
              <Skeleton 
                className={cn("size-8 rounded-md", getSkeletonAnimation())} 
                aria-label="Loading application logo"
              />
            </div>
            <div className="grid flex-1 gap-1.5">
              <Skeleton 
                className={cn("h-4", skeletonVariant === "compact" ? "w-20" : "w-24", getSkeletonAnimation())}
                aria-label="Loading application name"
              />
              <Skeleton 
                className={cn("h-3", skeletonVariant === "compact" ? "w-12" : "w-16", getSkeletonAnimation())}
                aria-label="Loading application version"
              />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );

  const renderContent = () => (
    <SidebarContent>
      <SidebarMenu>
        {Array.from({ length: menuItemsCount }).map((_, i) => (
          <SidebarMenuItem key={`menu-item-${i}`}>
            <SidebarMenuButton className="cursor-default">
              <Skeleton 
                className={cn("size-4 rounded-sm", getSkeletonAnimation())}
                style={{ animationDelay: `${i * 100}ms` }}
                aria-label={`Loading menu item ${i + 1}`}
              />
              <Skeleton 
                className={cn(
                  "h-4", 
                  menuItemWidths[i % menuItemWidths.length] ?? "w-20",
                  getSkeletonAnimation()
                )}
                style={{ animationDelay: `${i * 100 + 50}ms` }}
                aria-label={`Loading menu item ${i + 1} text`}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      {skeletonVariant === "detailed" && (
        <>
          {/* Additional section separator */}
          <div className="mx-2 my-4">
            <Skeleton className={cn("h-px w-full", getSkeletonAnimation())} />
          </div>
          
          {/* Secondary menu section */}
          <SidebarMenu>
            {Array.from({ length: 2 }).map((_, i) => (
              <SidebarMenuItem key={`secondary-item-${i}`}>
                <SidebarMenuButton size="sm" className="cursor-default">
                  <Skeleton 
                    className={cn("size-3 rounded-sm", getSkeletonAnimation())}
                    style={{ animationDelay: `${(menuItemsCount + i) * 100}ms` }}
                  />
                  <Skeleton 
                    className={cn("h-3 w-16", getSkeletonAnimation())}
                    style={{ animationDelay: `${(menuItemsCount + i) * 100 + 50}ms` }}
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </>
      )}
    </SidebarContent>
  );

  const renderFooter = () => {
    if (!showFooter) return null;
    
    return (
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="cursor-default">
              <Skeleton 
                className={cn("size-8 rounded-full", getSkeletonAnimation())}
                aria-label="Loading user avatar"
              />
              <div className="grid gap-1.5 flex-1">
                <Skeleton 
                  className={cn("h-4", skeletonVariant === "compact" ? "w-20" : "w-24", getSkeletonAnimation())}
                  aria-label="Loading user name"
                />
                <Skeleton 
                  className={cn("h-3", skeletonVariant === "compact" ? "w-24" : "w-32", getSkeletonAnimation())}
                  aria-label="Loading user email"
                />
              </div>
              {skeletonVariant === "detailed" && (
                <Skeleton 
                  className={cn("size-4 rounded-sm ml-auto", getSkeletonAnimation())}
                  aria-label="Loading user menu"
                />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    );
  };

  return (
    <Sidebar 
      variant="inset" 
      className={cn("overflow-hidden", className)}
      role="progressbar"
      aria-label="Loading sidebar content"
      aria-live="polite"
      {...props}
    >
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </Sidebar>
  );
});

AppSidebarSkeleton.displayName = "AppSidebarSkeleton";

export default AppSidebarSkeleton;

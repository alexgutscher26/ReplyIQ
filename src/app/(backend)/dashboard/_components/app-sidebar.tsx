"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-auth-hooks";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import {
  Brain,
  ChartArea,
  Command,
  FileChartLine,
  Image,
  Instagram,
  Languages,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  PieChart,
  Settings2,
  Users2,
  Video,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mic,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentProps, memo, useMemo } from "react";
import NavMain from "./nav-main";
import NavSecondary from "./nav-secondary";
import NavUser from "./nav-user";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      description: "Overview and analytics",
    },
    {
      title: "Hashtag Generator",
      url: "/dashboard/hashtag-generator",
      icon: Command,
      description: "Generate trending hashtags",
    },
    {
      title: "Thread Generator",
      url: "/dashboard/thread-generator",
      icon: MessageSquare,
      description: "Create engaging threads",
    },
    {
      title: "Video Script Generator",
      url: "/dashboard/video-script-generator",
      icon: Video,
      description: "AI-powered video scripts",
    },
    {
      title: "Image Caption Generator",
      url: "/dashboard/image-caption-generator", 
      icon: Image,
      description: "AI captions for uploaded images",
    },
    {
      title: "Story Generator",
      url: "/dashboard/story-generator",
      icon: Instagram,
      description: "AI-generated Instagram/Facebook stories",
    },
    {
      title: "Language Translator",
      url: "/dashboard/language-translator",
      icon: Languages,
      description: "Multi-language translation with AI context",
    },
    {
      title: "Sentiment Analysis",
      url: "/dashboard/sentiment-analysis",
      icon: Brain,
      description: "Analyze emotional tone before responding",
    },
    // { TODO: Add back in later NOTE: This is not working yet
    //   title: "Brand Voice Training",
    //   url: "/dashboard/brand-voice-training",
    //   icon: Mic,
    //   description: "Train AI on your unique brand voice",
    // },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: ChartArea,
      requireAdmin: true,
      description: "Detailed usage reports",
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: FileChartLine,
      requireAdmin: true,
      description: "Performance insights",
    },
    {
      title: "Tool Analytics",
      url: "/dashboard/tool-analytics",
      icon: PieChart,
      requireAdmin: true,
      description: "AI tool usage analytics",
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: PieChart,
      requireAdmin: true,
      description: "Manage products",
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: Users2,
      requireAdmin: true,
      description: "User management",
    },
    {
      title: "Settings",
      url: "/dashboard/settings/account",
      icon: Settings2,
      description: "Account & preferences",
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "support",
      icon: LifeBuoy,
      dialog: true,
      description: "Get help and support",
    },
  ],
};

interface AppSidebarProps extends ComponentProps<typeof Sidebar> {
  /** Whether to show usage statistics */
  showUsageStats?: boolean;
  /** Whether to show status indicators */
  showStatusIndicators?: boolean;
}

const AppSidebar = memo(function AppSidebar({
  showUsageStats = true,
  showStatusIndicators = true,
  className,
  ...props
}: AppSidebarProps) {
  const { user } = useSession();
  const pathname = usePathname();
  
  const { 
    data: usage, 
    isLoading: usageLoading, 
    error: usageError,
    isStale: usageStale 
  } = api.usage.getTotalUsage.useQuery({}, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  });

  // Helper function to check if user is admin
  const isAdmin = useMemo(() => {
    if (!user?.role) return false;
    const role = user.role.toUpperCase();
    return role === "ADMIN" || role === "ADMINISTRATOR" || user.role === "admin";
  }, [user?.role]);

  // Memoize filtered navigation items
  const filteredNavMain = useMemo(() => {
    // Debug logging - remove in production
    console.log("User role:", user?.role, "Type:", typeof user?.role, "Is Admin:", isAdmin);
    
    return data.navMain.filter(item => {
      if (item.requireAdmin && !isAdmin) {
        console.log(`Filtering out ${item.title} - requires admin but user role is:`, user?.role);
        return false;
      }
      return true;
    });
  }, [user?.role, isAdmin]);

  // Usage status component
  const UsageStatus = memo(function UsageStatus() {
    if (!showUsageStats) return null;

    if (usageLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
          <Skeleton className="h-3 w-16" />
        </div>
      );
    }

    if (usageError) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3" />
          <span>Usage unavailable</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        {showStatusIndicators && (
          <>
            <CheckCircle2 className={cn(
              "size-3 transition-colors",
              usageStale ? "text-yellow-500" : "text-green-500"
            )} />
            {usage?.total !== undefined && usage.total > 1000 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                High Usage
              </Badge>
            )}
          </>
        )}
        <span className={cn(
          "truncate text-xs transition-colors",
          usageStale ? "text-yellow-600" : "text-muted-foreground"
        )}>
          {usage?.total ? `${usage.total.toLocaleString()} generations` : "No usage yet"}
        </span>
      </div>
    );
  });

  // Brand header component
  const BrandHeader = memo(function BrandHeader() {
    const isCurrentPage = pathname === "/dashboard";
    
    return (
      <SidebarMenuButton 
        size="lg" 
        asChild 
        className={cn(
          "group transition-all duration-200 hover:bg-accent/60 active:scale-[0.98]",
          isCurrentPage && "bg-accent/30"
        )}
      >
        <Link 
          href="/dashboard"
          className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
          aria-label="Navigate to dashboard home"
        >
          <div className={cn(
            "flex aspect-square size-8 items-center justify-center rounded-lg transition-all duration-200",
            "bg-sidebar-primary text-sidebar-primary-foreground",
            "group-hover:scale-105 group-hover:shadow-sm",
            isCurrentPage && "scale-105 shadow-sm"
          )}>
            <Command className="size-4 transition-transform group-hover:rotate-3" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
            <span className="truncate font-semibold group-hover:text-foreground transition-colors">
              AI Replier
            </span>
            <UsageStatus />
          </div>
          {showStatusIndicators && isAdmin && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 ml-2">
              Admin
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    );
  });

  return (
    <Sidebar 
      variant="inset" 
      className={cn("border-r-2 transition-all duration-300", className)}
      role="navigation"
      aria-label="Main navigation sidebar"
      {...props}
    >
      <SidebarHeader className="border-b px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-background to-accent/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <BrandHeader />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="px-2 sm:px-3 py-2">
        <NavMain items={filteredNavMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      
      <SidebarFooter className="border-t px-2 py-2 sm:px-3 sm:py-3 bg-gradient-to-r from-background to-accent/5">
        <NavUser />
        
        {/* Status indicator bar */}
        {showStatusIndicators && (
          <div className="flex items-center justify-between px-2 py-1 mt-2 rounded-md bg-accent/20">
            <div className="flex items-center gap-2">
              <div className={cn(
                "size-2 rounded-full transition-colors",
                usageError ? "bg-destructive" : 
                usageStale ? "bg-yellow-500" : "bg-green-500"
              )} />
              <span className="text-xs text-muted-foreground">
                {usageError ? "Offline" : usageStale ? "Syncing" : "Online"}
              </span>
            </div>
            {isAdmin && (
              <Badge variant="outline" className="text-xs">
                Admin Panel
              </Badge>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
});

AppSidebar.displayName = "AppSidebar";

export default AppSidebar;

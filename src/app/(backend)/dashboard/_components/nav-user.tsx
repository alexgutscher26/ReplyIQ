"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "@/hooks/use-auth-hooks";
import { avatarFallback } from "@/utils";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  Sparkles,
  User,
  Settings,
  Shield,
  Crown,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo, useState } from "react";
import NavLogout from "./nav-logout";

interface NavUserProps {
  /** Whether to show status indicators */
  showStatusIndicators?: boolean;
  /** Whether to show role badges */
  showRoleBadges?: boolean;
  /** Compact mode for mobile */
  compact?: boolean;
}

const NavUser = memo(function NavUser({
  showStatusIndicators = true,
  showRoleBadges = true,
  compact = false,
}: NavUserProps) {
  const { user, isLoading, error } = useSession();
  const { isMobile } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);

  // Helper function to check if user is admin
  const isAdmin = useMemo(() => {
    if (!user?.role) return false;
    const role = user.role.toUpperCase();
    return role === "ADMIN" || role === "ADMINISTRATOR" || user.role === "admin";
  }, [user?.role]);

  // Helper function to get role display info
  const roleInfo = useMemo(() => {
    if (!user?.role) return null;
    
    const role = user.role.toUpperCase();
    if (role === "ADMIN" || role === "ADMINISTRATOR" || user.role === "admin") {
      return {
        label: "Admin",
        icon: Shield,
        variant: "destructive" as const,
        className: "text-destructive-foreground"
      };
    }
    if (role === "PRO" || role === "PREMIUM") {
      return {
        label: "Pro",
        icon: Crown,
        variant: "default" as const,
        className: "text-yellow-600"
      };
    }
    return {
      label: "User",
      icon: User,
      variant: "secondary" as const,
      className: "text-muted-foreground"
    };
  }, [user?.role]);

  // User avatar component with loading state
  const UserAvatar = memo(function UserAvatar({ 
    size = "size-8", 
    showStatus = false 
  }: { 
    size?: string; 
    showStatus?: boolean;
  }) {
    if (isLoading) {
      return <Skeleton className={cn(size, "rounded-lg")} />;
    }

    return (
      <div className="relative">
        <Avatar className={cn(size, "rounded-lg transition-all duration-200 group-hover:scale-105")}>
          <AvatarImage
            className="object-cover transition-all duration-200"
            src={user?.image ?? undefined}
            alt={user?.name ?? "User avatar"}
          />
          <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
            {avatarFallback(user?.name ?? "User")}
          </AvatarFallback>
        </Avatar>
        {showStatus && showStatusIndicators && (
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background transition-colors",
            error ? "bg-destructive" : "bg-green-500"
          )} />
        )}
      </div>
    );
  });

  // User info component with loading states
  const UserInfo = memo(function UserInfo({ 
    showEmail = true, 
    className 
  }: { 
    showEmail?: boolean; 
    className?: string;
  }) {
    if (isLoading) {
      return (
        <div className={cn("grid flex-1 gap-1", className)}>
          <Skeleton className="h-4 w-24" />
          {showEmail && <Skeleton className="h-3 w-32" />}
        </div>
      );
    }

    if (error || !user) {
      return (
        <div className={cn("grid flex-1 gap-1", className)}>
          <span className="text-sm font-medium text-destructive">Error loading user</span>
          {showEmail && <span className="text-xs text-muted-foreground">Please try again</span>}
        </div>
      );
    }

    return (
      <div className={cn("grid flex-1 gap-1 min-w-0", className)}>
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-sm transition-colors group-hover:text-foreground">
            {user.name || "Unknown User"}
          </span>
          {showRoleBadges && roleInfo && (
            <Badge 
              variant={roleInfo.variant} 
              className={cn("text-xs px-1.5 py-0.5", roleInfo.className)}
            >
              <roleInfo.icon className="size-2.5 mr-1" />
              {roleInfo.label}
            </Badge>
          )}
        </div>
        {showEmail && (
          <span className="truncate text-xs text-muted-foreground transition-colors group-hover:text-muted-foreground/80">
            {user.email || "No email"}
          </span>
        )}
      </div>
    );
  });

  // Enhanced menu items with better organization
  const menuItems = useMemo(() => {
    type MenuItem = {
      href: string;
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      description: string;
      highlight?: boolean;
    };

    type MenuSection = {
      section: string;
      items: MenuItem[];
    };

    const items: MenuSection[] = [
      // Quick Actions
      {
        section: "Quick Actions",
        items: [
          {
            href: "/dashboard/settings/account",
            icon: Sparkles,
            label: "Upgrade to Pro",
            description: "Unlock premium features",
            highlight: true, // Always highlight upgrade option
          },
        ],
      },
      // Account Management  
      {
        section: "Account",
        items: [
          {
            href: "/dashboard/settings/profile",
            icon: BadgeCheck,
            label: "Profile",
            description: "Manage your profile",
          },
          {
            href: "/dashboard/settings/account",
            icon: CreditCard,
            label: "Billing",
            description: "Manage subscription",
          },
          {
            href: "/dashboard/settings/account",
            icon: Bell,
            label: "Notifications",
            description: "Configure alerts",
          },
        ],
      },
    ];

    // Add admin section if user is admin
    if (isAdmin) {
      items.push({
        section: "Administration",
        items: [
          {
            href: "/dashboard/users",
            icon: Shield,
            label: "Admin Panel",
            description: "User management",
          },
          {
            href: "/dashboard/settings/general",
            icon: Settings,
            label: "System Settings",
            description: "Global configuration",
          },
        ],
      });
    }

    return items;
  }, [isAdmin]);

  if (!user && !isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <User className="size-8" />
            <div className="grid flex-1 text-left text-sm">
              <span className="text-muted-foreground">Not signed in</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "group transition-all duration-200",
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                "hover:bg-sidebar-accent/60 active:scale-[0.98]",
                compact && "px-2"
              )}
              aria-label="Open user menu"
              aria-expanded={isOpen}
            >
              <UserAvatar showStatus={!compact} />
              <UserInfo showEmail={!compact} className="text-left text-sm leading-tight" />
              <ChevronsUpDown className={cn(
                "ml-auto size-4 transition-all duration-200",
                isOpen && "rotate-180"
              )} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent
            className={cn(
              "w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-lg shadow-lg",
              "animate-in slide-in-from-top-2 duration-200"
            )}
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {/* User Header */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-2 py-2 text-left">
                <UserAvatar size="size-10" showStatus />
                <UserInfo />
                {showStatusIndicators && (
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 className={cn(
                      "size-3 transition-colors",
                      error ? "text-destructive" : "text-green-500"
                    )} />
                    <span className="text-xs text-muted-foreground">
                      {error ? "Offline" : "Online"}
                    </span>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            {/* Dynamic Menu Sections */}
            {menuItems.map((section, sectionIndex) => (
              <div key={section.section}>
                <DropdownMenuGroup>
                  {section.items.map((item) => (
                    <DropdownMenuItem 
                      key={item.href}
                      asChild
                      className={cn(
                        "group cursor-pointer transition-all duration-150",
                        "hover:bg-accent/80 focus:bg-accent",
                        item.highlight && "bg-accent/20 border-l-2 border-primary"
                      )}
                    >
                      <Link 
                        href={item.href}
                        className="flex items-center gap-3 px-2 py-2"
                      >
                        <item.icon className={cn(
                          "size-4 transition-colors",
                          item.highlight ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                        {item.highlight && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                {sectionIndex < menuItems.length - 1 && <DropdownMenuSeparator />}
              </div>
            ))}
            
            <DropdownMenuSeparator />
            <NavLogout />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
});

NavUser.displayName = "NavUser";

export default NavUser;

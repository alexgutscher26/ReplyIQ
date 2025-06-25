"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  return (
    <nav
      className={cn(
        // Mobile: horizontal scrolling, Desktop: vertical stack
        isMobile 
          ? "flex space-x-2 overflow-x-auto pb-2 scrollbar-hide" 
          : "flex flex-col space-y-1",
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href
              ? "bg-muted hover:bg-muted text-foreground"
              : "hover:bg-transparent hover:underline",
            "justify-start transition-all duration-200",
            // Mobile-specific styling
            isMobile && [
              "min-w-fit whitespace-nowrap px-4 py-2 text-sm",
              "min-h-[44px] flex items-center", // Better touch targets
              "active:scale-95", // Touch feedback
            ],
            // Desktop styling
            !isMobile && "w-full"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { type ReactNode } from "react";

interface MobileDashboardWrapperProps {
  children: ReactNode;
  className?: string;
}

export function MobileDashboardWrapper({ 
  children, 
  className 
}: MobileDashboardWrapperProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "w-full",
      // Mobile-specific improvements
      isMobile && [
        // Better touch targets
        "[&_button]:min-h-[44px]",
        "[&_a]:min-h-[44px]",
        // Improved spacing
        "[&_[data-slot='card-header']]:px-4 [&_[data-slot='card-header']]:py-3",
        "[&_[data-slot='card-content']]:px-4 [&_[data-slot='card-content']]:pb-4",
        // Better text sizing
        "[&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base",
        // Improved form elements
        "[&_input]:text-base [&_select]:text-base", // Prevents zoom on iOS
        "[&_textarea]:text-base",
        // Better card spacing
        "[&_.grid]:gap-3",
        // Enhanced touch feedback
        "[&_button]:transition-all [&_button]:active:scale-95",
        "[&_[role='button']]:transition-all [&_[role='button']]:active:scale-95",
        // Improved chart containers
        "[&_[data-slot='chart']]:px-2",
      ],
      className
    )}>
      {children}
    </div>
  );
} 
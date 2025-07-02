"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import {
  MessagesSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { memo, useMemo, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import React from "react";

// Constants for better maintainability
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const SIGNIFICANT_CHANGE_THRESHOLD = 5;
const MINIMAL_CHANGE_THRESHOLD = 0.1;

// Types
interface UsageData {
  total: number;
  percentageChange: number;
}

interface TotalUsageProps {
  /** Whether to show site-wide usage vs user-specific */
  isSiteWide?: boolean;
  /** Card size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show detailed metrics */
  showDetails?: boolean;
  /** Whether to enable interactive features */
  interactive?: boolean;
  /** Custom click handler */
  onClick?: () => void;
  /** Whether to show refresh button */
  showRefresh?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom aria-label for accessibility */
  "aria-label"?: string;
  /** Test ID for testing purposes */
  "data-testid"?: string;
}

// Utility functions moved outside component to prevent recreation
/**
 * Formats a number into a string representation with abbreviations for large numbers.
 *
 * This function checks the magnitude of the input number and formats it accordingly:
 * - If the number is 1,000,000 or greater, it converts it to millions (M) with one decimal place.
 * - If the number is 1,000 or greater but less than 1,000,000, it converts it to thousands (K) with one decimal place.
 * - Otherwise, it uses the `toLocaleString` method to format the number in a locale-sensitive manner.
 *
 * @param num - The number to be formatted.
 */
const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
};

/**
 * Determines the trend icon based on the change value.
 *
 * This function evaluates a numeric change value and returns a corresponding trend icon:
 * - `TrendingUp` if the change exceeds the minimal threshold.
 * - `TrendingDown` if the change is below the negative of the minimal threshold.
 * - `Minus` for changes within the minimal threshold range.
 */
const getTrendIcon = (change: number) => {
  if (change > MINIMAL_CHANGE_THRESHOLD) return TrendingUp;
  if (change < -MINIMAL_CHANGE_THRESHOLD) return TrendingDown;
  return Minus;
};

/**
 * Determines the trend color based on a numeric change value.
 *
 * The function evaluates the provided `change` value and returns a corresponding CSS class
 * string indicating the trend color. If the change exceeds the `MINIMAL_CHANGE_THRESHOLD`,
 * it returns a green color for positive trends. If the change is below the negative threshold,
 * it returns a red color for negative trends. Otherwise, it defaults to a muted foreground color.
 *
 * @param change - The numeric value representing the change in trend.
 */
const getTrendColor = (change: number): string => {
  if (change > MINIMAL_CHANGE_THRESHOLD) return "text-green-600 dark:text-green-400";
  if (change < -MINIMAL_CHANGE_THRESHOLD) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
};

/**
 * Determines the background color class based on the change value.
 *
 * This function evaluates the change value against a minimal threshold and returns
 * a corresponding background color class string. If the change is positive,
 * it returns a green background class; if negative, a red background class;
 * otherwise, a muted background class.
 *
 * @param {number} change - The numerical change value to evaluate.
 */
const getTrendBg = (change: number): string => {
  if (change > MINIMAL_CHANGE_THRESHOLD) return "bg-green-50 dark:bg-green-950/20";
  if (change < -MINIMAL_CHANGE_THRESHOLD) return "bg-red-50 dark:bg-red-950/20";
  return "bg-muted/50";
};

/**
 * Determines the growth label based on the change value.
 */
const getGrowthLabel = (change: number): string => {
  if (Math.abs(change) < MINIMAL_CHANGE_THRESHOLD) return "Stable";
  return change > 0 ? "Growing" : "Declining";
};

// Size configurations
const SIZE_CONFIGS = {
  sm: {
    card: "h-32",
    title: "text-xs",
    value: "text-lg font-bold",
    icon: "size-3",
    padding: "p-3",
  },
  md: {
    card: "h-36",
    title: "text-sm font-medium sm:text-base",
    value: "text-xl font-bold sm:text-2xl lg:text-3xl",
    icon: "size-4 sm:size-5",
    padding: "p-4",
  },
  lg: {
    card: "h-44",
    title: "text-lg",
    value: "text-3xl font-bold lg:text-4xl",
    icon: "size-6",
    padding: "p-6",
  },
} as const;

const TotalUsage = memo(function TotalUsage({
  isSiteWide = false,
  size = "md",
  showDetails = true,
  interactive = true,
  onClick,
  showRefresh = true,
  className,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: TotalUsageProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  const { data, refetch, isStale, error, isLoading } =
    api.usage.getTotalUsage.useQuery(
      { isSiteWide },
      {
        staleTime: STALE_TIME,
        refetchOnWindowFocus: false,
        suspense: false,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    );

  // Handle manual refresh with debouncing
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    setIsRefreshing(true);
    
    try {
      await refetch();
      toast.success("Usage data refreshed", {
        icon: <CheckCircle2 className="size-4 text-green-500" />,
        duration: 3000,
      });
    } catch (refreshError) {
      console.error("Failed to refresh usage data:", refreshError);
      toast.error("Failed to refresh data. Please try again.", {
        icon: <AlertCircle className="text-destructive size-4" />,
        duration: 5000,
      });
    } finally {
      // Add slight delay to prevent rapid clicking
      refreshTimeoutRef.current = setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  }, [refetch, isRefreshing]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Memoized calculations for performance
  const metrics = useMemo(() => {
    if (!data) return null;

    const TrendIcon = getTrendIcon(data.percentageChange);
    const isGrowing = data.percentageChange > MINIMAL_CHANGE_THRESHOLD;
    const isSignificantChange = Math.abs(data.percentageChange) > SIGNIFICANT_CHANGE_THRESHOLD;

    return {
      total: data.total,
      formattedTotal: formatNumber(data.total),
      percentageChange: data.percentageChange,
      TrendIcon,
      trendColor: getTrendColor(data.percentageChange),
      trendBg: getTrendBg(data.percentageChange),
      growthLabel: getGrowthLabel(data.percentageChange),
      isGrowing,
      isSignificantChange,
      // Additional computed values for better UX
      absoluteChange: Math.abs(data.percentageChange),
      changeDirection: data.percentageChange > 0 ? "increase" : data.percentageChange < 0 ? "decrease" : "stable",
    };
  }, [data]);

  // Size-based styling (memoized)
  const sizeStyles = useMemo(() => SIZE_CONFIGS[size], [size]);

  // Computed aria-label for better accessibility
  const computedAriaLabel = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    
    const usageType = isSiteWide ? "Site-wide" : "Personal";
    const total = metrics?.formattedTotal ?? "loading";
    const trend = metrics ? `, ${metrics.changeDirection} by ${metrics.absoluteChange.toFixed(1)}% from last month` : "";
    
    return `${usageType} usage: ${total} generations${trend}`;
  }, [ariaLabel, isSiteWide, metrics]);

  // Keyboard event handler for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!interactive || !onClick) return;
    
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }, [interactive, onClick]);

  // Loading state
  if (isLoading) {
    return (
      <Card
        className={cn(
          "animate-pulse transition-all duration-200",
          sizeStyles.card,
          className,
        )}
        data-testid={testId ? `${testId}-loading` : undefined}
        aria-label="Loading usage data"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="size-5 rounded" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !data) {
    const errorMessage = error?.message ?? "Unable to load usage data";
    
    return (
      <Card
        className={cn(
          "border-destructive/20 transition-all duration-200",
          sizeStyles.card,
          className,
        )}
        data-testid={testId ? `${testId}-error` : undefined}
        aria-label={`Error: ${errorMessage}`}
        role="alert"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={sizeStyles.title}>
            {isSiteWide ? "Site Usage" : "Your Usage"}
          </CardTitle>
          <AlertCircle 
            className={cn("text-destructive", sizeStyles.icon)} 
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-destructive font-medium text-sm">
            {errorMessage}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7 text-xs"
            aria-label="Retry loading usage data"
          >
            <RefreshCw
              className={cn("mr-1 size-3", isRefreshing && "animate-spin")}
              aria-hidden="true"
            />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-primary/5 hover:-translate-y-0.5 hover:shadow-lg",
        interactive && [
          "hover:border-primary/20 cursor-pointer focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        ],
        metrics?.isGrowing &&
        "bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/10",
        sizeStyles.card,
        className
      )}
      onClick={interactive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={computedAriaLabel}
      data-testid={testId}
    >
      {/* Background gradient effect */}
      <div
        className="from-primary/5 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true" 
      />

      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle
          className={cn(
            "group-hover:text-foreground transition-colors",
            sizeStyles.title
          )}
        >
          {isSiteWide ? "Total Site Usage" : "Your Usage"}
        </CardTitle>

        <MessagesSquare
          className={cn(
            "text-muted-foreground group-hover:text-primary transition-all group-hover:scale-110",
            sizeStyles.icon
          )}
          aria-hidden="true" 
        />
      </CardHeader>

      <CardContent className="relative space-y-3">
        {/* Main metric */}
        <div className="flex items-end gap-2">
          <div
            className={cn(
              "group-hover:text-primary transition-all",
              sizeStyles.value
            )}
            aria-label={`${metrics?.total.toLocaleString()} total generations`}
          >
            {metrics?.formattedTotal}
          </div>
          {metrics?.total !== undefined &&
            metrics.total !== parseFloat(metrics.formattedTotal.replace(/[^\d.-]/g, "")) && (
              <div
                className="text-muted-foreground mb-1 font-mono text-xs"
                aria-label={`Exact count: ${metrics.total.toLocaleString()}`}
              >
                {metrics.total.toLocaleString()}
              </div>
            )}
        </div>

        {/* Change indicator */}
        {showDetails && metrics && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all",
                  metrics.trendBg,
                  metrics.trendColor
                )}
                role="status"
                aria-label={`${metrics.changeDirection} by ${metrics.absoluteChange.toFixed(1)}% from last month`}
              >
                <metrics.TrendIcon className="size-3" aria-hidden="true" />
                <span>
                  {metrics.percentageChange > 0 ? "+" : ""}
                  {metrics.percentageChange.toFixed(1)}%
                </span>
              </div>

              {metrics.isSignificantChange && (
                <Badge
                  variant={metrics.isGrowing ? "default" : "secondary"}
                  className="px-1.5 py-0.5 text-xs"
                  aria-label={`Trend: ${metrics.growthLabel}`}
                >
                  {metrics.growthLabel}
                </Badge>
              )}
            </div>

            {interactive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  // Could open detailed analytics
                }}
                aria-label="View detailed analytics"
              >
                <BarChart3 className="mr-1 size-3" aria-hidden="true" />
                Details
              </Button>
            )}
          </div>
        )}

        <p className="text-muted-foreground group-hover:text-muted-foreground/80 text-xs transition-colors">
          from last month
        </p>
      </CardContent>
    </Card>
  );
});

TotalUsage.displayName = "TotalUsage";

export default TotalUsage;
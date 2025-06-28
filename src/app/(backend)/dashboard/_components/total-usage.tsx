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
import { memo, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";

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
}

const TotalUsage = memo(function TotalUsage({
  isSiteWide = false,
  size = "md",
  showDetails = true,
  interactive = true,
  onClick,
  showRefresh = true,
  className,
}: TotalUsageProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, refetch, isStale, error, isLoading } =
    api.usage.getTotalUsage.useQuery(
      { isSiteWide },
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        suspense: false, // Disable suspense for better error handling
      },
    );

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Usage data refreshed", {
        icon: <CheckCircle2 className="size-4 text-green-500" />,
      });
    } catch {
      toast.error("Failed to refresh data", {
        icon: <AlertCircle className="text-destructive size-4" />,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, isRefreshing]);

  // Memoized calculations for performance
  const metrics = useMemo(() => {
    if (!data) return null;

    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toLocaleString();
    };

    const getTrendIcon = (change: number) => {
      if (change > 0) return TrendingUp;
      if (change < 0) return TrendingDown;
      return Minus;
    };

    const getTrendColor = (change: number) => {
      if (change > 0) return "text-green-600 dark:text-green-400";
      if (change < 0) return "text-red-600 dark:text-red-400";
      return "text-muted-foreground";
    };

    const getTrendBg = (change: number) => {
      if (change > 0) return "bg-green-50 dark:bg-green-950/20";
      if (change < 0) return "bg-red-50 dark:bg-red-950/20";
      return "bg-muted/50";
    };

    const getGrowthLabel = (change: number) => {
      if (Math.abs(change) < 0.1) return "Stable";
      if (change > 0) return "Growing";
      return "Declining";
    };

    const TrendIcon = getTrendIcon(data.percentageChange);

    return {
      total: data.total,
      formattedTotal: formatNumber(data.total),
      percentageChange: data.percentageChange,
      TrendIcon,
      trendColor: getTrendColor(data.percentageChange),
      trendBg: getTrendBg(data.percentageChange),
      growthLabel: getGrowthLabel(data.percentageChange),
      isGrowing: data.percentageChange > 0,
      isSignificantChange: Math.abs(data.percentageChange) > 5,
    };
  }, [data]);

  // Size-based styling
  const sizeStyles = useMemo(() => {
    switch (size) {
      case "sm":
        return {
          card: "h-32",
          title: "text-xs",
          value: "text-lg font-bold",
          icon: "size-3",
          padding: "p-3",
        };
      case "lg":
        return {
          card: "h-44",
          title: "text-lg",
          value: "text-3xl font-bold lg:text-4xl",
          icon: "size-6",
          padding: "p-6",
        };
      default:
        return {
          card: "h-36",
          title: "text-sm font-medium sm:text-base",
          value: "text-xl font-bold sm:text-2xl lg:text-3xl",
          icon: "size-4 sm:size-5",
          padding: "p-4",
        };
    }
  }, [size]);

  // Loading state
  if (isLoading) {
    return (
      <Card
        className={cn(
          "transition-all duration-200",
          sizeStyles.card,
          className,
        )}
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
    return (
      <Card
        className={cn(
          "border-destructive/20 transition-all duration-200",
          sizeStyles.card,
          className,
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={sizeStyles.title}>
            {isSiteWide ? "Site Usage" : "Your Usage"}
          </CardTitle>
          <AlertCircle className={cn("text-destructive", sizeStyles.icon)} />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-destructive font-medium">Error loading data</div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7 text-xs"
          >
            <RefreshCw
              className={cn("mr-1 size-3", isRefreshing && "animate-spin")}
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
        interactive && "hover:border-primary/20 cursor-pointer",
        metrics?.isGrowing &&
          "bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/10",
        sizeStyles.card,
        className,
      )}
      onClick={interactive ? onClick : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`Total usage: ${metrics?.formattedTotal} generations`}
    >
      {/* Background gradient effect */}
      <div className="from-primary/5 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle
          className={cn(
            "group-hover:text-foreground transition-colors",
            sizeStyles.title,
          )}
        >
          {isSiteWide ? "Total Site Usage" : "Your Usage"}
        </CardTitle>

        <div className="flex items-center gap-2">
          {/* Status indicators */}
          {showDetails && (
            <>
              {isStale && <Clock className="size-3 text-yellow-500" />}
              <CheckCircle2 className="size-3 text-green-500" />
            </>
          )}

          {/* Refresh button */}
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                void handleRefresh();
              }}
              disabled={isRefreshing}
              className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <RefreshCw
                className={cn("size-3", isRefreshing && "animate-spin")}
              />
            </Button>
          )}

          <MessagesSquare
            className={cn(
              "text-muted-foreground group-hover:text-primary transition-all group-hover:scale-110",
              sizeStyles.icon,
            )}
          />
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        {/* Main metric */}
        <div className="flex items-end gap-2">
          <div
            className={cn(
              "group-hover:text-primary transition-all",
              sizeStyles.value,
            )}
          >
            {metrics?.formattedTotal}
          </div>
          {metrics?.total !== undefined &&
            metrics.total !==
              parseFloat(metrics.formattedTotal.replace(/[^\d.-]/g, "")) && (
              <div className="text-muted-foreground mb-1 font-mono text-xs">
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
                  metrics.trendColor,
                )}
              >
                <metrics.TrendIcon className="size-3" />
                <span>
                  {metrics.percentageChange > 0 ? "+" : ""}
                  {metrics.percentageChange.toFixed(1)}%
                </span>
              </div>

              {metrics.isSignificantChange && (
                <Badge
                  variant={metrics.isGrowing ? "default" : "secondary"}
                  className="px-1.5 py-0.5 text-xs"
                >
                  {metrics.growthLabel}
                </Badge>
              )}
            </div>

            {interactive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  // Could open detailed analytics
                }}
              >
                <BarChart3 className="mr-1 size-3" />
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

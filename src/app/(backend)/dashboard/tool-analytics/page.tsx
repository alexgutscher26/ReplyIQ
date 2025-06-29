"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/trpc/react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Brain,
  Languages,
  Hash,
  MessageSquare,
  Video,
  FileImage,
  Smile,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  Zap,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp as Growth,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Enhanced chart configuration
const chartConfig = {
  usage: {
    label: "Usage",
    color: "hsl(var(--chart-1))",
  },
  users: {
    label: "Users",
    color: "hsl(var(--chart-2))",
  },
  success: {
    label: "Success Rate",
    color: "hsl(var(--chart-3))",
  },
  performance: {
    label: "Performance",
    color: "hsl(var(--chart-4))",
  },
  'ai-generation': {
    label: "AI Generation",
    color: "hsl(var(--chart-1))",
  },
  'analysis': {
    label: "Analysis",
    color: "hsl(var(--chart-2))",
  },
  'translation': {
    label: "Translation",
    color: "hsl(var(--chart-3))",
  },
  'enhancement': {
    label: "Enhancement",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

// Enhanced tool icon mapping with more visual variety
/**
 * Retrieves the appropriate icon component based on the tool name.
 *
 * This function maps a given tool name to its corresponding icon component.
 * It uses a switch statement to determine which icon to return based on the tool name.
 * If the tool name does not match any known cases, it defaults to returning an Activity icon.
 *
 * @param toolName - The name of the tool for which to retrieve the icon.
 * @returns A React component representing the icon associated with the tool name.
 */
const getToolIcon = (toolName: string) => {
  const iconClass = "h-4 w-4";
  switch (toolName) {
    case 'hashtag-generator':
      return <Hash className={iconClass} />;
    case 'thread-generator':
      return <MessageSquare className={iconClass} />;
    case 'video-script-generator':
      return <Video className={iconClass} />;
    case 'image-caption-generator':
      return <FileImage className={iconClass} />;
    case 'story-generator':
      return <MessageSquare className={iconClass} />;
    case 'language-translator':
      return <Languages className={iconClass} />;
    case 'sentiment-analysis':
      return <Brain className={iconClass} />;
    case 'emoji-suggestions':
      return <Smile className={iconClass} />;
    default:
      return <Activity className={iconClass} />;
  }
};

// Enhanced trend indicator with more detailed analysis
/**
 * Determines the trend indicator based on growth percentage and size.
 *
 * This function returns a JSX element representing an icon indicating the trend.
 * It checks the growth value against several conditions to decide which icon to render.
 * The icon's size is determined by the 'size' parameter, with default being "sm".
 *
 * @param growth - A numeric value representing the growth percentage.
 * @param size - An optional string that determines the icon size ("sm", "md", or "lg"). Defaults to "sm".
 * @returns A JSX element representing the trend indicator icon.
 */
const getTrendIndicator = (growth: number, size: "sm" | "md" | "lg" = "sm") => {
  const iconSize = size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6";
  
  if (growth > 10) {
    return <ArrowUpRight className={`${iconSize} text-green-500`} />;
  } else if (growth > 0) {
    return <TrendingUp className={`${iconSize} text-green-400`} />;
  } else if (growth < -10) {
    return <ArrowDownRight className={`${iconSize} text-red-500`} />;
  } else if (growth < 0) {
    return <TrendingDown className={`${iconSize} text-red-400`} />;
  }
  return <Minus className={`${iconSize} text-gray-400`} />;
};

// Get performance status
/**
 * Determines the performance status based on the success rate.
 *
 * This function evaluates the provided `successRate` and returns an object containing
 * an icon, a color, and a label that correspond to different performance levels.
 * The thresholds for these levels are as follows:
 * - Excellent: 95% and above
 * - Good: 85% to 94%
 * - Warning: 70% to 84%
 * - Critical: Below 70%
 *
 * @param successRate - A number representing the success rate percentage.
 */
const getPerformanceStatus = (successRate: number) => {
  if (successRate >= 95) return { icon: CheckCircle2, color: "text-green-500", label: "Excellent" };
  if (successRate >= 85) return { icon: CheckCircle2, color: "text-blue-500", label: "Good" };
  if (successRate >= 70) return { icon: AlertCircle, color: "text-yellow-500", label: "Warning" };
  return { icon: XCircle, color: "text-red-500", label: "Critical" };
};

// Real-time status indicator
/**
 * Renders a real-time status component with toggle functionality.
 *
 * This function displays a visual indicator of whether real-time updates are enabled or disabled,
 * along with an optional refresh state. It includes a switch to toggle the enabled state and shows
 * additional information when updates are enabled. The component is styled based on its current state.
 *
 * @param isEnabled - A boolean indicating if real-time updates are currently enabled.
 * @param onToggle - A callback function that toggles the enabled state of real-time updates.
 * @param isRefreshing - An optional boolean indicating if the data is currently being refreshed.
 */
function RealTimeStatus({ 
  isEnabled, 
  onToggle, 
  isRefreshing 
}: { 
  isEnabled: boolean; 
  onToggle: (enabled: boolean) => void;
  isRefreshing?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full transition-colors ${
        isRefreshing ? 'bg-blue-500 animate-spin' : 
        isEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
      }`} />
      <div className="flex flex-col">
        <Label htmlFor="realtime" className="text-sm">
          {isRefreshing ? 'Refreshing...' : 'Real-time'}
        </Label>
        {isEnabled && (
          <span className="text-xs text-muted-foreground">Updates every 15s</span>
        )}
      </div>
      <Switch
        id="realtime"
        checked={isEnabled}
        onCheckedChange={onToggle}
        disabled={isRefreshing}
      />
    </div>
  );
}

// Enhanced overview cards with more detailed metrics
/**
 * Renders a grid of cards displaying tool analytics overview statistics.
 *
 * This component fetches tool analytics data using the `useQuery` hook from `api.toolAnalytics.getOverviewStats`.
 * While data is loading, it displays skeleton loaders. Once data is available, it maps the data to an array of card objects
 * and renders each card with relevant statistics, trends, and icons.
 *
 * @param isRefreshing - Optional boolean indicating whether the component is in a refreshing state.
 * @returns A React JSX element representing the grid of overview cards.
 */
function OverviewCards({ isRefreshing }: { isRefreshing?: boolean }) {
  const { data: overview, isLoading } = api.toolAnalytics.getOverviewStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Usage",
      value: overview?.totalUsage?.toLocaleString() ?? 0,
      description: "All time tool interactions",
      icon: Activity,
      trend: 12.5,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Users",
      value: overview?.activeUsers7d ?? 0,
      description: `Last 7 days (${overview?.totalUsers} total)`,
      icon: Users,
      trend: 8.2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Usage This Week",
      value: overview?.usage7d ?? 0,
      description: "Last 7 days activity",
      icon: Calendar,
      trend: -3.1,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Success Rate",
      value: "94.2%",
      description: "Average completion rate",
      icon: Target,
      trend: 2.8,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className={`relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 ${
          isRefreshing ? 'ring-2 ring-blue-500/50 ring-opacity-75 animate-pulse' : ''
        }`}>
          <div className={`absolute top-0 right-0 w-20 h-20 ${card.bgColor} rounded-full -translate-y-6 translate-x-6 opacity-20`} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`p-1 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIndicator(card.trend, "sm")}
                <span className={`text-xs font-medium ${
                  card.trend > 0 ? 'text-green-600' : 
                  card.trend < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {card.trend > 0 ? '+' : ''}{card.trend}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Enhanced tool usage chart with multiple visualization options
/**
 * Renders a tool usage chart based on the specified period and chart type.
 *
 * This component fetches tool usage statistics from an API and renders them as either a bar, line, or area chart.
 * It handles loading states by displaying skeletons until the data is available. The user can switch between chart types
 * using a select dropdown, which triggers a callback function provided via props.
 *
 * @param period - The time period for which to fetch tool usage statistics ("7d", "30d", "90d", or "1y").
 * @param chartType - The type of chart to render ("bar", "line", or "area").
 * @param onChartTypeChange - A callback function invoked when the user changes the chart type.
 */
function ToolUsageChart({ 
  period, 
  chartType, 
  onChartTypeChange 
}: { 
  period: "7d" | "30d" | "90d" | "1y"; 
  chartType: "bar" | "line" | "area";
  onChartTypeChange: (type: "bar" | "line" | "area") => void;
}) {
  const { data: stats, isLoading } = api.toolAnalytics.getToolUsageStats.useQuery({ period });

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  /**
   * Renders a chart based on the specified chart type.
   *
   * This function determines the type of chart to render by checking the `chartType` variable.
   * It then returns a React component corresponding to the chart type, using common configurations
   * such as CartesianGrid, XAxis, YAxis, and ChartTooltip. The data for the charts is derived from
   * the `stats?.toolUsageCounts` or an empty array if undefined.
   */
  const renderChart = () => {
    const data = stats?.toolUsageCounts ?? [];
    
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="toolDisplayName" angle={-45} textAnchor="end" height={100} fontSize={12} />
            <YAxis />
            <ChartTooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="count" stroke="var(--color-usage)" strokeWidth={2} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="toolDisplayName" angle={-45} textAnchor="end" height={100} fontSize={12} />
            <YAxis />
            <ChartTooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="count" stroke="var(--color-usage)" fill="var(--color-usage)" fillOpacity={0.3} />
          </AreaChart>
        );
      default:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="toolDisplayName" angle={-45} textAnchor="end" height={100} fontSize={12} />
            <YAxis />
            <ChartTooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="var(--color-usage)" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <Card className="col-span-full border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tool Usage Analytics
            </CardTitle>
            <CardDescription>
              Comprehensive usage breakdown by AI tool ({period})
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={chartType} onValueChange={(value) => onChartTypeChange(value as "bar" | "line" | "area")}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="area">Area</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Custom tooltip component
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      count: number;
      percentage: string;
      uniqueUsers: number;
      totalDuration?: number;
      successRate?: number;
    };
  }>;
  label?: string;
}

/**
 * Renders a custom tooltip component based on provided props.
 *
 * This function checks if the tooltip is active and has valid payload data.
 * It then constructs and returns a JSX element displaying various statistics such as usage count, unique users,
 * average duration, and success rate. If any of these optional metrics are not available, they are omitted from the display.
 * If the tooltip is not active or the payload is invalid, it returns null.
 */
function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload?.[0]?.payload) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-4 min-w-[200px]">
        <p className="font-semibold text-sm mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm flex justify-between">
            <span className="text-muted-foreground">Usage:</span>
            <span className="font-medium text-blue-600">{data.count} ({data.percentage}%)</span>
          </p>
          <p className="text-sm flex justify-between">
            <span className="text-muted-foreground">Users:</span>
            <span className="font-medium text-green-600">{data.uniqueUsers}</span>
          </p>
          {data.totalDuration && (
            <p className="text-sm flex justify-between">
              <span className="text-muted-foreground">Avg Duration:</span>
              <span className="font-medium text-purple-600">{Math.round(data.totalDuration / data.count)}ms</span>
            </p>
          )}
          {data.successRate && (
            <p className="text-sm flex justify-between">
              <span className="text-muted-foreground">Success Rate:</span>
              <span className="font-medium text-orange-600">{data.successRate}%</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
}

// Enhanced performance metrics with detailed insights
/**
 * Displays performance metrics for a selected time period.
 *
 * This component fetches tool performance data based on the specified period and renders it in a card format.
 * If data is loading, it shows skeletons; otherwise, it displays detailed performance insights including growth trends,
 * success rates, and usage statistics. The component uses `api.toolAnalytics.getToolPerformance.useQuery` to fetch data
 * and maps over the performance array to render individual tool metrics.
 *
 * @param period - The time period for which to fetch performance data ("7d", "30d", or "90d").
 */
function PerformanceMetrics({ period }: { period: "7d" | "30d" | "90d" }) {
  const { data: performance, isLoading } = api.toolAnalytics.getToolPerformance.useQuery({ period });

  if (isLoading) {
    return (
      <Card className="col-span-2 border-0 shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2 border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Growth className="h-5 w-5" />
          Performance Insights
        </CardTitle>
        <CardDescription>
          Growth trends and performance indicators ({period})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performance?.performance.slice(0, 8).map((tool, index) => {
            const toolWithSuccess = tool as typeof tool & { successRate?: number };
            const successRate = toolWithSuccess.successRate ?? 90;
            const status = getPerformanceStatus(successRate);
            return (
              <div key={tool.toolName} className="group p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                        {index + 1}
                      </Badge>
                      {getToolIcon(tool.toolName)}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{tool.toolDisplayName}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <status.icon className={`h-3 w-3 ${status.color}`} />
                        <span className={`text-xs ${status.color}`}>{status.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-sm font-medium">{tool.currentPeriodUsage}</p>
                      <p className="text-xs text-muted-foreground">uses</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIndicator(tool.growthRate, "sm")}
                      <span className={`text-xs font-medium ${
                        tool.growthRate > 0 ? 'text-green-600' : 
                        tool.growthRate < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {tool.growthRate > 0 ? '+' : ''}{tool.growthRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 ml-11">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Performance</span>
                    <span>{successRate}%</span>
                  </div>
                  <Progress value={successRate} className="h-1" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Main analytics dashboard component
/**
 * Represents an analytics dashboard page for monitoring AI tool performance and user engagement.
 *
 * This component manages various states such as period, chart type, real-time enabled status,
 * active tab, refreshing state, and last updated time. It uses tRPC utils for data invalidation
 * and provides functionality for manual and auto-refresh of data. The dashboard includes
 * several sections like overview, usage, performance, and users, each displaying different
 * analytics metrics and charts.
 *
 * Additionally, it handles real-time state persistence in localStorage, keyboard shortcuts,
 * and admin notices. The component leverages hooks like useEffect, useCallback for side effects,
 * and event listeners for user interactions.
 */
export default function ToolAnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initialize real-time state from localStorage on mount
  useEffect(() => {
    try {
      const savedRealtimeState = localStorage.getItem('analytics-realtime-enabled');
      if (savedRealtimeState !== null) {
        const parsedState = JSON.parse(savedRealtimeState) as unknown;
        if (typeof parsedState === 'boolean') {
          setRealtimeEnabled(parsedState);
        }
      }
    } catch (error) {
      console.warn('Failed to load real-time preference from localStorage:', error);
    }
  }, []);

  // Persist real-time state to localStorage when it changes
  const handleRealtimeToggle = useCallback((enabled: boolean) => {
    setRealtimeEnabled(enabled);
    try {
      localStorage.setItem('analytics-realtime-enabled', JSON.stringify(enabled));
    } catch (error) {
      console.warn('Failed to save real-time preference to localStorage:', error);
    }
  }, []);

  // Get tRPC utils for data invalidation
  const utils = api.useUtils();

  // Real-time data refresh function
  const refreshData = useCallback(async (isManual = false) => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Invalidate all tool analytics queries to trigger refetch
      await Promise.all([
        utils.toolAnalytics.getOverviewStats.invalidate(),
        utils.toolAnalytics.getToolUsageStats.invalidate({ period }),
        utils.toolAnalytics.getToolPerformance.invalidate({ 
          period: period === "1y" ? "90d" : period 
        }),
      ]);
      
      // Only show success toast for manual refreshes
      if (isManual) {
        toast.success("Data refreshed successfully", {
          description: "Analytics data has been updated with the latest information",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
      // Always show error toasts regardless of manual/auto
      toast.error("Failed to refresh data", {
        description: "Please try again or check your connection",
        duration: 4000,
      });
    } finally {
      // Add a small delay to show the refreshing state
      setTimeout(() => {
        setIsRefreshing(false);
        setLastUpdated(new Date());
      }, 500);
    }
  }, [utils, period, isRefreshing]);

  // Auto-refresh every 15 seconds when real-time is enabled
  useEffect(() => {
    if (!realtimeEnabled) return;
    
    // Initial refresh when enabling real-time (silent)
    void refreshData(false);
    
    const interval = setInterval(() => {
      void refreshData(false); // Auto-refresh is silent
    }, 15000); // 15 seconds for better real-time feel

    return () => clearInterval(interval);
  }, [realtimeEnabled, refreshData]);

  // Keyboard shortcut for manual refresh (R key)
  useEffect(() => {
    /**
     * Handles keydown events to trigger a manual refresh of data.
     *
     * This function listens for the 'r' or 'R' key press without any modifier keys (Ctrl, Meta, Shift).
     * When the specified conditions are met, it prevents the default event behavior and triggers
     * a manual refresh of data, which also shows a toast notification.
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'r' || event.key === 'R') {
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
          event.preventDefault();
          void refreshData(true); // Manual refresh shows toast
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Comprehensive insights into AI tool performance and user engagement
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <RealTimeStatus 
              isEnabled={realtimeEnabled} 
              onToggle={handleRealtimeToggle}
              isRefreshing={isRefreshing}
            />
            <Select value={period} onValueChange={(value: "7d" | "30d" | "90d" | "1y") => setPeriod(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refreshData(true)}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh data manually (Press R)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Separator />

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Cards */}
            <OverviewCards isRefreshing={isRefreshing} />

            {/* Main Analytics */}
            <div className="grid gap-6 lg:grid-cols-3">
              <ToolUsageChart period={period} chartType={chartType} onChartTypeChange={setChartType} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <CategoryBreakdown period={period} />
              <PerformanceMetrics period={period === "1y" ? "90d" : period} />
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <ToolUsageChart period={period} chartType={chartType} onChartTypeChange={setChartType} />
            <CategoryBreakdown period={period} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceMetrics period={period === "1y" ? "90d" : period} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <TopUsers period={period} />
          </TabsContent>
        </Tabs>

        {/* Admin Notice */}
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Sparkles className="h-5 w-5" />
              Advanced Analytics Suite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              This comprehensive analytics dashboard provides administrators with powerful insights to:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Monitor real-time tool performance and usage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Identify trends and optimization opportunities
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Track user engagement and satisfaction
                </li>
              </ul>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Analyze performance bottlenecks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Export detailed reports and insights
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Make data-driven product decisions
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Keep the existing CategoryBreakdown and TopUsers components (they were working well)
/**
 * Renders a category breakdown chart based on the specified period.
 *
 * This function fetches tool usage statistics for the given period and displays them in a pie chart.
 * It shows loading skeletons while data is being fetched and renders an empty chart if no data is available.
 *
 * @param {Object} props - The component props.
 * @param {"7d" | "30d" | "90d" | "1y"} props.period - The time period for which to fetch the statistics.
 */
function CategoryBreakdown({ period }: { period: "7d" | "30d" | "90d" | "1y" }) {
  const { data: stats, isLoading } = api.toolAnalytics.getToolUsageStats.useQuery({ period });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Category Distribution
        </CardTitle>
        <CardDescription>
          Usage breakdown by tool category ({period})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats?.categoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, count }) => `${category}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {stats?.categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Renders a card displaying top active users based on the specified period.
 *
 * This function fetches user statistics from the API and displays them in a card format.
 * It handles loading states by showing skeletons, and formats the data to show top 10 users with their interaction counts and average session durations.
 *
 * @param {Object} props - The component's properties.
 * @param {"7d" | "30d" | "90d" | "1y"} props.period - The time period for which to fetch user statistics.
 * @returns {JSX.Element} A React element representing the top active users card.
 */
function TopUsers({ period }: { period: "7d" | "30d" | "90d" | "1y" }) {
  const { data: stats, isLoading } = api.toolAnalytics.getToolUsageStats.useQuery({ period });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Top Active Users
        </CardTitle>
        <CardDescription>
          Most engaged users in the platform ({period})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats?.topUsers.slice(0, 10).map((user, index) => (
            <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Badge 
                  variant={index < 3 ? "default" : "outline"} 
                  className={`w-8 h-8 flex items-center justify-center p-0 ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-amber-600' : ''
                  }`}
                >
                  {index + 1}
                </Badge>
                <div>
                  <p className="text-sm font-medium">{user.userName ?? 'Anonymous User'}</p>
                  <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{user.count} interactions</p>
                {user.totalDuration && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round(user.totalDuration / 1000)}s avg session
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 
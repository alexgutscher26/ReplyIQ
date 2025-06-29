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
 * Returns an icon component based on the tool name provided.
 *
 * The function maps a given tool name to its corresponding icon component.
 * If the tool name does not match any predefined cases, it defaults to returning an Activity icon.
 *
 * @param toolName - A string representing the name of the tool.
 * @returns An icon component associated with the tool name.
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
 * Determines and returns a trend indicator based on growth value and size.
 *
 * The function selects an appropriate icon component based on the growth value:
 * - ArrowUpRight for growth > 10, colored green.
 * - TrendingUp for 0 < growth <= 10, colored light green.
 * - ArrowDownRight for growth < -10, colored red.
 * - TrendingDown for -10 <= growth < 0, colored light red.
 * - Minus for growth === 0, colored gray.
 *
 * The size of the icon is determined by the 'size' parameter and defaults to "sm".
 *
 * @param growth - The numeric value indicating the trend growth.
 * @param size - The size of the icon, which can be "sm", "md", or "lg". Defaults to "sm".
 * @returns A React component representing the trend indicator.
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
 * This function evaluates the provided success rate and returns an object containing
 * an icon, a color class, and a label that reflects the performance status. The criteria
 * for categorization are as follows:
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
 * Renders a real-time status component with an indicator and toggle switch.
 *
 * This component displays a circular indicator that changes color based on the
 * `isEnabled` and `isRefreshing` states. It also includes a label and a toggle
 * switch to enable or disable the real-time feature. The switch is disabled when
 * `isRefreshing` is true.
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
 * Renders a grid of overview cards displaying various analytics metrics.
 *
 * This component fetches tool analytics data using `api.toolAnalytics.getOverviewStats.useQuery`.
 * If the data is loading, it displays skeleton loaders instead of actual card content.
 * Once the data is available, it maps over predefined card configurations to render each card with relevant stats and trends.
 * The cards include sections for title, value, description, icon, trend indicator, and conditional styling based on refresh state.
 *
 * @param isRefreshing - An optional boolean indicating whether the component should display a refresh animation.
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
 * Renders a tool usage chart based on the provided period and chart type.
 *
 * It fetches tool usage statistics using the `api.toolAnalytics.getToolUsageStats.useQuery` hook.
 * If data is loading, it displays skeleton placeholders. Once data is available,
 * it renders different types of charts (line, area, or bar) based on the selected chart type.
 * The component also includes a dropdown to switch between chart types and a download button.
 *
 * @param period - The time period for which to fetch tool usage statistics ("7d", "30d", "90d", "1y").
 * @param chartType - The type of chart to render ("bar", "line", "area").
 * @param onChartTypeChange - A callback function to handle changes in the selected chart type.
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
   * This function determines the type of chart to render (line, area, or bar) and returns the corresponding
   * React component with predefined configurations such as axes, grid, tooltip, and data visualization elements.
   * The data for the chart is derived from `stats.toolUsageCounts`, defaulting to an empty array if not available.
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
 * This function checks if the tooltip is active and has payload data. If so, it extracts the relevant data
 * and renders a styled div containing various metrics such as usage count, users, average duration, and success rate.
 * Each metric is conditionally rendered based on the presence of corresponding data in the payload.
 *
 * @param {TooltipProps} props - The props object containing active status, payload data, and label.
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
 * Renders performance metrics based on a specified period.
 *
 * This function fetches tool performance data using the provided period and displays it in a card format.
 * If data is loading, it shows skeletons; otherwise, it maps through the performance data to render individual tool insights,
 * including success rates, growth trends, and usage statistics. The function leverages helper functions like `getPerformanceStatus`,
 * `getToolIcon`, and `getTrendIndicator` to enhance the display of each tool's performance metrics.
 *
 * @param {Object} props - The component props.
 * @param {"7d" | "30d" | "90d"} props.period - The period for which to fetch performance data.
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
 * Main component for the Tool Analytics Dashboard page.
 *
 * This component manages various states such as period, chart type, real-time enabled status,
 * active tab, refreshing state, and last updated time. It fetches analytics data using tRPC
 * queries and refreshes it based on user actions or real-time settings. The component also handles
 * local storage for persisting the real-time preference across sessions.
 *
 * @returns JSX.Element representing the Tool Analytics Dashboard page.
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
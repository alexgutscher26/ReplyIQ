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
import { api } from "@/trpc/react";
import { useState } from "react";
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
  AlertTriangle,
} from "lucide-react";

// Chart configuration for different visualizations
const chartConfig = {
  usage: {
    label: "Usage",
    color: "hsl(var(--chart-1))",
  },
  users: {
    label: "Users",
    color: "hsl(var(--chart-2))",
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

// Tool icon mapping
const getToolIcon = (toolName: string) => {
  switch (toolName) {
    case 'hashtag-generator':
      return <Hash className="h-4 w-4" />;
    case 'thread-generator':
      return <MessageSquare className="h-4 w-4" />;
    case 'video-script-generator':
      return <Video className="h-4 w-4" />;
    case 'image-caption-generator':
      return <FileImage className="h-4 w-4" />;
    case 'story-generator':
      return <MessageSquare className="h-4 w-4" />;
    case 'language-translator':
      return <Languages className="h-4 w-4" />;
    case 'sentiment-analysis':
      return <Brain className="h-4 w-4" />;
    case 'emoji-suggestions':
      return <Smile className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

// Get trend indicator
const getTrendIndicator = (growth: number) => {
  if (growth > 0) {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  } else if (growth < 0) {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
  return <div className="h-4 w-4" />;
};

// Overview stats cards
function OverviewCards() {
  const { data: overview, isLoading } = api.toolAnalytics.getOverviewStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview?.totalUsage?.toLocaleString() ?? 0}</div>
          <p className="text-xs text-muted-foreground">
            All time tool interactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview?.activeUsers7d ?? 0}</div>
          <p className="text-xs text-muted-foreground">
            Last 7 days ({overview?.totalUsers} total)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usage This Week</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview?.usage7d ?? 0}</div>
          <p className="text-xs text-muted-foreground">
            Last 7 days activity
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {overview?.mostPopularTool?.displayName ?? "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {overview?.mostPopularTool?.usage} uses this month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Tool usage statistics chart
function ToolUsageChart({ period }: { period: "7d" | "30d" | "90d" | "1y" }) {
  const { data: stats, isLoading } = api.toolAnalytics.getToolUsageStats.useQuery({ period });

  if (isLoading) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Tool Usage Statistics
        </CardTitle>
        <CardDescription>
          Usage breakdown by AI tool ({period})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.toolUsageCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="toolDisplayName" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload?.[0]?.payload) {
                    const data = payload[0].payload as { 
                      count: number; 
                      percentage: string; 
                      uniqueUsers: number; 
                      totalDuration?: number; 
                    };
                    return (
                      <div className="bg-background border rounded-lg shadow-md p-3">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-blue-600">
                          Usage: {data.count} ({data.percentage}%)
                        </p>
                        <p className="text-sm text-green-600">
                          Unique Users: {data.uniqueUsers}
                        </p>
                        {data.totalDuration && (
                          <p className="text-sm text-purple-600">
                            Avg Duration: {Math.round(data.totalDuration / data.count)}ms
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="var(--color-usage)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Category breakdown pie chart
function CategoryBreakdown({ period }: { period: "7d" | "30d" | "90d" | "1y" }) {
  const { data: stats, isLoading } = api.toolAnalytics.getToolUsageStats.useQuery({ period });

  if (isLoading) {
    return (
      <Card className="col-span-2">
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
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Category Breakdown
        </CardTitle>
        <CardDescription>
          Usage by tool category ({period})
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
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload?.[0]?.payload) {
                    const data = payload[0].payload as { 
                      category: string; 
                      count: number; 
                      uniqueUsers: number; 
                    };
                    return (
                      <div className="bg-background border rounded-lg shadow-md p-3">
                        <p className="font-medium capitalize">{data.category}</p>
                        <p className="text-sm text-blue-600">
                          Usage: {data.count}
                        </p>
                        <p className="text-sm text-green-600">
                          Unique Users: {data.uniqueUsers}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Performance metrics
function PerformanceMetrics({ period }: { period: "7d" | "30d" | "90d" }) {
  const { data: performance, isLoading } = api.toolAnalytics.getToolPerformance.useQuery({ period });

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
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
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
        <CardDescription>
          Growth and performance indicators ({period})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performance?.performance.slice(0, 8).map((tool) => (
            <div key={tool.toolName} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getToolIcon(tool.toolName)}
                <span className="text-sm font-medium">{tool.toolDisplayName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{tool.currentPeriodUsage}</span>
                {getTrendIndicator(tool.growthRate)}
                <span className={`text-xs ${
                  tool.growthRate > 0 ? 'text-green-600' : 
                  tool.growthRate < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {tool.growthRate > 0 ? '+' : ''}{tool.growthRate.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Top users table
function TopUsers({ period }: { period: "7d" | "30d" | "90d" | "1y" }) {
  const { data: stats, isLoading } = api.toolAnalytics.getToolUsageStats.useQuery({ period });

  if (isLoading) {
    return (
      <Card className="col-span-4">
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
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Top Users
        </CardTitle>
        <CardDescription>
          Most active users ({period})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats?.topUsers.slice(0, 10).map((user, index) => (
            <div key={user.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                  {index + 1}
                </Badge>
                <div>
                  <p className="text-sm font-medium">{user.userName ?? 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{user.count} uses</p>
                {user.totalDuration && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round(user.totalDuration / 1000)}s avg
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

export default function ToolAnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  return (
    <div className="flex-1 space-y-6 p-10 pb-16">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Tool Analytics</h2>
          <p className="text-muted-foreground">
            Detailed insights into AI tool usage patterns and user behavior.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(value: "7d" | "30d" | "90d" | "1y") => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Overview Cards */}
      <OverviewCards />

      {/* Main Analytics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ToolUsageChart period={period} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CategoryBreakdown period={period} />
        <PerformanceMetrics period={period === "1y" ? "90d" : period} />
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <TopUsers period={period} />
      </div>

      {/* Help Section */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5" />
            Admin Only Feature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            This analytics dashboard is only accessible to administrators. Use these insights to:
          </p>
          <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-1">
            <li>Identify the most popular AI tools and focus development efforts</li>
            <li>Monitor user engagement and tool adoption rates</li>
            <li>Optimize resource allocation based on usage patterns</li>
            <li>Track performance trends and user satisfaction</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 
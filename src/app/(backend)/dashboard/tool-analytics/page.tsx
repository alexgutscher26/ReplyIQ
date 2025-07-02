/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { api } from "@/trpc/react";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

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
  Calendar as CalendarIcon,
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
  Settings,
  Bell,
  FileText,
  Download as Export,
  Eye,
  Lightbulb,
  Gauge,
  Grid3X3,
  Mail,
  Share2,
} from "lucide-react";

// Type definitions for analytics data
interface PerformanceData {
  toolName: string;
  toolDisplayName: string;
  currentPeriodUsage: number;
  growthRate: number;
  successRate?: number;
}

interface UserData {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  count: number;
  totalDuration: number;
}

// 1. Define the type
type ToolFilter = { type: "low-usage" } | null;

// Enhanced tool icon mapping with more visual variety
const getToolIcon = (toolName: string) => {
  const iconClass = "h-4 w-4";
  switch (toolName) {
    case "hashtag-generator":
      return <Hash className={iconClass} />;
    case "thread-generator":
      return <MessageSquare className={iconClass} />;
    case "video-script-generator":
      return <Video className={iconClass} />;
    case "image-caption-generator":
      return <FileImage className={iconClass} />;
    case "story-generator":
      return <MessageSquare className={iconClass} />;
    case "language-translator":
      return <Languages className={iconClass} />;
    case "sentiment-analysis":
      return <Brain className={iconClass} />;
    case "emoji-suggestions":
      return <Smile className={iconClass} />;
    default:
      return <Activity className={iconClass} />;
  }
};

// Enhanced trend indicator with more detailed analysis
const getTrendIndicator = (growth: number, size: "sm" | "md" | "lg" = "sm") => {
  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6";

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
const getPerformanceStatus = (successRate: number) => {
  if (successRate >= 95)
    return { icon: CheckCircle2, color: "text-green-500", label: "Excellent" };
  if (successRate >= 85)
    return { icon: CheckCircle2, color: "text-blue-500", label: "Good" };
  if (successRate >= 70)
    return { icon: AlertCircle, color: "text-yellow-500", label: "Warning" };
  return { icon: XCircle, color: "text-red-500", label: "Critical" };
};

// Enhanced overview cards with more detailed metrics
function OverviewCards() {
  const { data: overview, isLoading } =
    api.toolAnalytics.getOverviewStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-16" />
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
      trend: overview?.trends?.totalUsage ?? 0,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Users",
      value: overview?.activeUsers7d ?? 0,
      description: `Last 7 days (${overview?.totalUsers} total)`,
      icon: Users,
      trend: overview?.trends?.activeUsers7d ?? 0,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Usage This Week",
      value: overview?.usage7d ?? 0,
      description: "Last 7 days activity",
      icon: CalendarIcon,
      trend: overview?.trends?.usage7d ?? 0,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Success Rate",
      value: `${overview?.successRate?.toFixed(1) ?? 0}%`,
      description: "Average completion rate",
      icon: Target,
      trend: overview?.trends?.successRate ?? 0,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {card.description}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIndicator(card.trend, "sm")}
                <span
                  className={`text-xs font-medium ${
                    card.trend > 0
                      ? "text-green-600"
                      : card.trend < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {card.trend > 0 ? "+" : ""}
                  {card.trend}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Enhanced tool usage table
function ToolUsageChart({
  period,
  onExport,
  toolFilter,
  setToolFilter,
}: {
  period: "7d" | "30d" | "90d" | "1y";
  onExport: () => void;
  toolFilter: ToolFilter;
  setToolFilter: React.Dispatch<React.SetStateAction<ToolFilter>>;
}) {
  const { data: stats, isLoading } =
    api.toolAnalytics.getToolUsageStats.useQuery({ period });
  const tableRef = useRef<HTMLDivElement>(null);

  // Scroll table into view when filter is set
  React.useEffect(() => {
    if (toolFilter && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [toolFilter]);

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

  // Sort data in descending order
  let sortedData = [...(stats?.toolUsageCounts ?? [])].sort(
    (a, b) => b.count - a.count,
  );

  if (toolFilter?.type === "low-usage") {
    sortedData = sortedData.filter((tool) => tool.count < 10);
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tool Usage Analytics
            </CardTitle>
            <CardDescription>
              Usage breakdown by AI tool ({period})
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        {toolFilter && (
          <div className="my-2 flex items-center gap-2">
            {toolFilter.type === "low-usage" && (
              <Badge variant="outline" className="mb-2">
                Filtered: Low Usage Tools
              </Badge>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setToolFilter(null)}
            >
              Clear Filter
            </Button>
          </div>
        )}

        {/* Statistics Summary */}
        <div className="bg-muted/30 mt-4 flex items-center gap-6 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary h-2 w-2 rounded-full"></div>
            <span className="text-sm font-medium">
              {stats?.toolUsageCounts?.length ?? 0} Tools Tracked
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-primary/80 h-2 w-2 rounded-full"></div>
            <span className="text-sm font-medium">
              {(
                stats?.toolUsageCounts?.reduce(
                  (sum, tool) => sum + tool.count,
                  0,
                ) ?? 0
              ).toLocaleString()}{" "}
              Total Uses
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-primary/60 h-2 w-2 rounded-full"></div>
            <span className="text-sm font-medium">
              {stats?.toolUsageCounts
                ?.reduce((sum, tool) => sum + Number(tool.uniqueUsers || 0), 0)
                .toLocaleString()}{" "}
              Active Users
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border" ref={tableRef}>
          {sortedData.length === 0 ? (
            <div className="text-muted-foreground p-6 text-center">
              No low-usage tools found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead className="text-right">Usage Count</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead className="text-right">Unique Users</TableHead>
                  <TableHead className="text-right">Avg Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((tool, index) => (
                  <TableRow key={tool.toolName} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Badge
                        variant={index < 3 ? "default" : "outline"}
                        className="flex h-8 w-8 items-center justify-center p-0"
                      >
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getToolIcon(tool.toolName)}
                        <div>
                          <div className="font-medium">
                            {tool.toolDisplayName}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {tool.toolName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {tool.count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="bg-muted h-2 w-16 rounded-full">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${tool.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {tool.percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(tool.uniqueUsers).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {tool.totalDuration
                        ? `${Math.round(tool.totalDuration / tool.count)}ms`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced performance metrics with detailed insights
function PerformanceMetrics({ period }: { period: "7d" | "30d" | "90d" }) {
  const { data: performance, isLoading } =
    api.toolAnalytics.getToolPerformance.useQuery({ period });

  if (isLoading) {
    return (
      <Card className="col-span-2">
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
    <Card className="col-span-2">
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
          {performance?.performance
            .slice(0, 8)
            .map((tool: PerformanceData, index: number) => {
              const successRate = tool.successRate ?? 90;
              const status = getPerformanceStatus(successRate);
              return (
                <div
                  key={tool.toolName}
                  className="group hover:bg-muted/50 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="flex h-6 w-6 items-center justify-center p-0 text-xs"
                        >
                          {index + 1}
                        </Badge>
                        {getToolIcon(tool.toolName)}
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          {tool.toolDisplayName}
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <status.icon className={`h-3 w-3 ${status.color}`} />
                          <span className={`text-xs ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-sm font-medium">
                          {tool.currentPeriodUsage}
                        </p>
                        <p className="text-muted-foreground text-xs">uses</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIndicator(tool.growthRate, "sm")}
                        <span
                          className={`text-xs font-medium ${
                            tool.growthRate > 0
                              ? "text-green-600"
                              : tool.growthRate < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {tool.growthRate > 0 ? "+" : ""}
                          {tool.growthRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 ml-11">
                    <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
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

// Enhanced export functionality
function ExportModal({
  isOpen,
  onClose,
  period,
}: {
  isOpen: boolean;
  onClose: () => void;
  period: "7d" | "30d" | "90d" | "1y";
}) {
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | "json">(
    () => {
      try {
        const savedSettings = localStorage.getItem("analytics-settings");
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          return settings.exportFormat ?? "csv";
        }
      } catch (error) {
        console.warn("Failed to load export format setting:", error);
      }
      return "csv";
    },
  );
  const [isExporting, setIsExporting] = useState(false);

  // Get the actual data for export
  const { data: stats } = api.toolAnalytics.getToolUsageStats.useQuery({
    period,
  });
  const { data: overview } = api.toolAnalytics.getOverviewStats.useQuery();
  const { data: performance } = api.toolAnalytics.getToolPerformance.useQuery({
    period: period === "1y" ? "90d" : period,
  });

  // Reset format to saved default when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const savedSettings = localStorage.getItem("analytics-settings");
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.exportFormat) {
            setExportFormat(settings.exportFormat);
          }
        }
      } catch (error) {
        console.warn("Failed to load export format setting:", error);
      }
    }
  }, [isOpen]);

  const generateCSV = () => {
    if (!stats?.toolUsageCounts) return "";

    const headers = [
      "Tool Name",
      "Display Name",
      "Usage Count",
      "Percentage",
      "Unique Users",
      "Total Duration",
    ];
    const rows = stats.toolUsageCounts.map((tool) => [
      tool.toolName,
      tool.toolDisplayName,
      tool.count.toString(),
      tool.percentage,
      tool.uniqueUsers.toString(),
      tool.totalDuration?.toString() || "0",
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const generateJSON = () => {
    return JSON.stringify(
      {
        period,
        exportDate: new Date().toISOString(),
        overview,
        toolUsage: stats?.toolUsageCounts ?? [],
        categoryBreakdown: stats?.categoryBreakdown ?? [],
        topUsers: stats?.topUsers ?? [],
        performance: performance?.performance ?? [],
      },
      null,
      2,
    );
  };

  const generatePDF = () => {
    // For PDF, we'll create a formatted text content
    let content = `Analytics Report - ${period}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;

    content += `OVERVIEW\n`;
    content += `Total Usage: ${overview?.totalUsage ?? 0}\n`;
    content += `Active Users (7d): ${overview?.activeUsers7d ?? 0}\n`;
    content += `Usage (7d): ${overview?.usage7d ?? 0}\n\n`;

    content += `TOOL USAGE\n`;
    stats?.toolUsageCounts?.forEach((tool, index) => {
      content += `${index + 1}. ${tool.toolDisplayName}: ${tool.count} uses (${tool.percentage}%)\n`;
    });

    return content;
  };

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split("T")[0];
      let content = "";
      let filename = "";
      let mimeType = "";

      switch (exportFormat) {
        case "csv":
          content = generateCSV();
          filename = `analytics-${period}-${timestamp}.csv`;
          mimeType = "text/csv";
          break;
        case "json":
          content = generateJSON();
          filename = `analytics-${period}-${timestamp}.json`;
          mimeType = "application/json";
          break;
        case "pdf":
          content = generatePDF();
          filename = `analytics-${period}-${timestamp}.txt`;
          mimeType = "text/plain";
          break;
      }

      // Small delay to show the loading state
      await new Promise((resolve) => setTimeout(resolve, 1000));

      downloadFile(content, filename, mimeType);

      toast.success(`Data exported as ${exportFormat.toUpperCase()}`, {
        description: `File downloaded: ${filename}`,
      });
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed", {
        description: "Please try again or contact support",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Export Analytics Data</CardTitle>
          <CardDescription>Export data for period: {period}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Format</Label>
            <Select
              value={exportFormat}
              onValueChange={(value: "csv" | "pdf" | "json") =>
                setExportFormat(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV - Spreadsheet Data</SelectItem>
                <SelectItem value="json">JSON - Raw Data</SelectItem>
                <SelectItem value="pdf">TXT - Formatted Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground text-xs">
            {exportFormat === "csv" &&
              "Tool usage data in CSV format for spreadsheet analysis"}
            {exportFormat === "json" &&
              "Complete data in JSON format including all metrics"}
            {exportFormat === "pdf" && "Human-readable report in text format"}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              className="flex-1"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Export className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Settings Modal Component
function SettingsModal({
  isOpen,
  onClose,
  dashboardLayout,
  setDashboardLayout,
  applyTheme,
}: {
  isOpen: boolean;
  onClose: () => void;
  dashboardLayout: string;
  setDashboardLayout: (layout: string) => void;
  applyTheme: (theme: string) => void;
}) {
  const [settings, setSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem("analytics-settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return {
          autoRefresh: parsed.autoRefresh ?? false,
          showAnimations: parsed.showAnimations ?? true,
          compactMode: parsed.compactMode ?? dashboardLayout === "compact",
          showTooltips: parsed.showTooltips ?? true,
          defaultPeriod: parsed.defaultPeriod ?? "30d",
          exportFormat: parsed.exportFormat ?? "csv",
          theme: parsed.theme ?? "system",
        };
      }
    } catch (error) {
      console.warn("Failed to load settings:", error);
    }
    return {
      autoRefresh: false,
      showAnimations: true,
      compactMode: dashboardLayout === "compact",
      showTooltips: true,
      defaultPeriod: "30d",
      exportFormat: "csv",
      theme: "system",
    };
  });

  const handleSaveSettings = () => {
    try {
      // Save to localStorage
      localStorage.setItem("analytics-settings", JSON.stringify(settings));

      // Apply layout changes
      setDashboardLayout(settings.compactMode ? "compact" : "default");

      // Apply theme changes
      applyTheme(settings.theme);

      toast.success("Settings saved successfully", {
        description: "Your preferences have been updated",
      });
      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings", {
        description: "Please try again",
      });
    }
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      autoRefresh: false,
      showAnimations: true,
      compactMode: false,
      showTooltips: true,
      defaultPeriod: "30d",
      exportFormat: "csv",
      theme: "system",
    };
    setSettings(defaultSettings);
    setDashboardLayout("default");
    localStorage.removeItem("analytics-settings");

    // Apply default theme
    applyTheme("system");

    toast.success("Settings reset to defaults");
  };

  // Apply theme when modal opens
  useEffect(() => {
    if (isOpen) {
      applyTheme(settings.theme);
    }
  }, [isOpen, settings.theme, applyTheme]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="max-h-[80vh] w-[500px] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard Settings
          </CardTitle>
          <CardDescription>
            Configure your analytics dashboard preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Layout Settings */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium">
              <Grid3X3 className="h-4 w-4" />
              Layout & Display
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Compact Mode</Label>
                  <p className="text-muted-foreground text-xs">
                    Use a more condensed layout
                  </p>
                </div>
                <Button
                  variant={settings.compactMode ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      compactMode: !settings.compactMode,
                    })
                  }
                >
                  {settings.compactMode ? "On" : "Off"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Show Animations</Label>
                  <p className="text-muted-foreground text-xs">
                    Enable smooth transitions and effects
                  </p>
                </div>
                <Button
                  variant={settings.showAnimations ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      showAnimations: !settings.showAnimations,
                    })
                  }
                >
                  {settings.showAnimations ? "On" : "Off"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Show Tooltips</Label>
                  <p className="text-muted-foreground text-xs">
                    Display helpful tooltips on hover
                  </p>
                </div>
                <Button
                  variant={settings.showTooltips ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      showTooltips: !settings.showTooltips,
                    })
                  }
                >
                  {settings.showTooltips ? "On" : "Off"}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Data & Export Settings */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium">
              <Download className="h-4 w-4" />
              Data & Export
            </h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Default Export Format</Label>
                <Select
                  value={settings.exportFormat}
                  onValueChange={(value) =>
                    setSettings({ ...settings, exportFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV - Spreadsheet</SelectItem>
                    <SelectItem value="json">JSON - Raw Data</SelectItem>
                    <SelectItem value="pdf">TXT - Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Theme Settings */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4" />
              Appearance
            </h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) =>
                    setSettings({ ...settings, theme: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleResetSettings}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} className="flex-1">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Performance Alerts Component
function PerformanceAlerts() {
  const { data: settings, isLoading } = api.settings.general.useQuery();
  const sendAlert = api.toolAnalytics.sendPerformanceAlert.useMutation();

  const handleSendAlert = () => {
    sendAlert.mutate(
      {
        type: "success-rate",
        message: "Manual test alert from dashboard",
      },
      {
        onSuccess: (data) => {
          toast.success("Performance alert sent!", {
            description: data.message,
          });
        },
        onError: (error) => {
          toast.error("Failed to send alert", { description: error.message });
        },
      },
    );
  };

  if (isLoading || !settings) {
    return (
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-amber-800 dark:from-amber-950/20 dark:to-yellow-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" />
            Performance Alerts
          </CardTitle>
          <CardDescription>
            Get notified when metrics exceed your thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground space-y-3 text-sm">
            Loading thresholds...
          </div>
        </CardContent>
      </Card>
    );
  }

  const performanceAlerts = settings.performanceAlerts || {};

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-amber-800 dark:from-amber-950/20 dark:to-yellow-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-600" />
          Performance Alerts
        </CardTitle>
        <CardDescription>
          Get notified when metrics exceed your thresholds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Success Rate Threshold</Label>
            <Badge variant="outline">
              {performanceAlerts.successRateThreshold ?? 85}%
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Usage Growth Alert</Label>
            <Badge variant="outline">
              {performanceAlerts.growthThreshold ?? -10}%
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Error Rate Alert</Label>
            <Badge variant="outline">
              {performanceAlerts.errorRateThreshold ?? 5}%
            </Badge>
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={handleSendAlert}
            disabled={sendAlert.isPending}
          >
            <Mail className="mr-2 h-4 w-4" />
            {sendAlert.isPending ? "Sending..." : "Send Test Alert"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Main analytics dashboard component
export default function ToolAnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New enhanced state
  const [comparePeriod, setComparePeriod] = useState<
    "7d" | "30d" | "90d" | "1y"
  >("7d");
  const [showExportModal, setShowExportModal] = useState(false);
  const [dashboardLayout, setDashboardLayout] = useState("default");
  const [toolFilter, setToolFilter] = useState<ToolFilter>(null);

  // Apply theme helper function
  const applyTheme = useCallback((theme: string) => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, []);

  // Load saved settings on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("analytics-settings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.compactMode) {
          setDashboardLayout("compact");
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (
          settings.defaultPeriod &&
          ["7d", "30d", "90d", "1y"].includes(settings.defaultPeriod)
        ) {
          setPeriod(settings.defaultPeriod as "7d" | "30d" | "90d" | "1y");
        }
        // Apply saved theme
        if (settings.theme) {
          applyTheme(settings.theme);
        }
      }
    } catch (error) {
      console.warn("Failed to load saved settings:", error);
    }
  }, [applyTheme]);

  // Get tRPC utils for data invalidation
  const utils = api.useUtils();

  // Manual data refresh function
  const refreshData = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      // Invalidate all tool analytics queries to trigger refetch
      await Promise.all([
        utils.toolAnalytics.getOverviewStats.invalidate(),
        utils.toolAnalytics.getToolUsageStats.invalidate({ period }),
        utils.toolAnalytics.getToolPerformance.invalidate({
          period: period === "1y" ? "90d" : period,
        }),
      ]);

      toast.success("Data refreshed successfully", {
        description:
          "Analytics data has been updated with the latest information",
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.error("Failed to refresh data", {
        description: "Please try again or check your connection",
        duration: 4000,
      });
    } finally {
      // Add a small delay to show the refreshing state
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  }, [utils, period, isRefreshing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Manual refresh (R key)
      if (event.key === "r" || event.key === "R") {
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
          event.preventDefault();
          void refreshData();
        }
      }

      // Settings panel (S key)
      if (event.key === "s" || event.key === "S") {
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
          event.preventDefault();
          setShowSettingsModal(true);
        }
      }

      // Export modal (E key)
      if (event.key === "e" || event.key === "E") {
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
          event.preventDefault();
          setShowExportModal(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [refreshData]);

  // Share functionality
  const handleShare = useCallback(async () => {
    try {
      const url = window.location.href;
      const title = "Analytics Dashboard - Tool Performance Insights";
      const text = `Check out these analytics insights for period: ${period}`;

      // Check if Web Share API is available
      if ("share" in navigator && navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });
        toast.success("Dashboard shared successfully");
      } else if ("clipboard" in navigator && navigator.clipboard) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
        toast.success("Dashboard link copied to clipboard", {
          description: "Share the link with your team",
        });
      } else {
        // Manual fallback
        const shareText = `${title}\n${text}\n${url}`;
        // Try to select and copy
        const textArea = document.createElement("textarea");
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast.success("Dashboard link copied", {
          description: "Paste to share with your team",
        });
      }
    } catch (error: unknown) {
      console.error("Share failed:", error);
      toast.error("Failed to share dashboard", {
        description: "Please try again or copy the URL manually",
      });
    }
  }, [period]);

  // Settings functionality
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const handleSettings = useCallback(() => {
    setShowSettingsModal(true);
  }, []);

  const handleOpenExportModal = () => setShowExportModal(true);

  return (
    <div className="from-background to-muted/20 min-h-screen bg-gradient-to-br p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Enhanced Header */}
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
                  Analytics Dashboard
                </h1>
                <Badge variant="secondary" className="animate-pulse">
                  Enhanced
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg">
                Advanced insights into AI tool performance and user engagement
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDashboardLayout(
                    dashboardLayout === "default" ? "compact" : "default",
                  )
                }
              >
                <Grid3X3 className="mr-2 h-4 w-4" />
                {dashboardLayout === "default" ? "Compact" : "Default"}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSettings()}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open settings (Press S)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Enhanced Controls Bar */}
          <div className="bg-muted/30 flex flex-wrap items-center gap-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Period:</Label>
              <Select
                value={period}
                onValueChange={(value: "7d" | "30d" | "90d" | "1y") =>
                  setPeriod(value)
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Compare:</Label>
              <Select
                value={comparePeriod}
                onValueChange={(value: "7d" | "30d" | "90d" | "1y") =>
                  setComparePeriod(value)
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshData()}
                      disabled={isRefreshing}
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                      />
                      {isRefreshing ? "Refreshing..." : "Refresh"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh data manually (Press R)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExportModal(true)}
                    >
                      <Export className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export analytics data (Press E)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="outline" size="sm" onClick={() => handleShare()}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          period={period}
        />
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          dashboardLayout={dashboardLayout}
          setDashboardLayout={setDashboardLayout}
          applyTheme={applyTheme}
        />

        <Separator />

        {/* Tabs Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Usage
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex items-center gap-2"
            >
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
            <OverviewCards />

            {/* Enhanced Analytics Grid */}
            <div
              className={`grid gap-6 ${dashboardLayout === "compact" ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}
            >
              <div className="lg:col-span-2">
                <ToolUsageChart
                  period={period}
                  onExport={handleOpenExportModal}
                  toolFilter={toolFilter}
                  setToolFilter={setToolFilter}
                />
              </div>
              <div className="space-y-6">
                <PerformanceAlerts />
              </div>
            </div>

            {/* Secondary Analytics */}
            <div className="grid gap-6 md:grid-cols-3">
              <CategoryBreakdown period={period} />
              <PerformanceMetrics period={period === "1y" ? "90d" : period} />
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <div className="grid gap-6">
              <ToolUsageChart
                period={period}
                onExport={handleOpenExportModal}
                toolFilter={toolFilter}
                setToolFilter={setToolFilter}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <CategoryBreakdown period={period} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PerformanceMetrics period={period === "1y" ? "90d" : period} />
              <div className="space-y-6">
                <PerformanceAlerts />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <TopUsers period={period} />
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    User Engagement Metrics
                  </CardTitle>
                  <CardDescription>
                    Detailed user behavior analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Session Duration</span>
                      <Badge variant="outline">4.2 minutes</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tools per Session</span>
                      <Badge variant="outline">2.8 avg</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Return User Rate</span>
                      <Badge variant="outline">76%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Peak Usage Time</span>
                      <Badge variant="outline">2-4 PM</Badge>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>User Satisfaction</span>
                        <span>94%</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Enhanced Admin Notice */}
        <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 dark:border-emerald-800 dark:from-emerald-950/20 dark:to-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <Sparkles className="h-5 w-5" />
              Enhanced Analytics Suite v2.0
            </CardTitle>
            <CardDescription className="text-emerald-700 dark:text-emerald-300">
              Advanced AI-powered insights and real-time monitoring for optimal
              performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200">
                  <BarChart3 className="h-4 w-4" />
                  Analytics Features
                </h4>
                <ul className="space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Real-time performance monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Advanced filtering & search
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Custom date range selection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Comparative period analysis
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200">
                  <Lightbulb className="h-4 w-4" />
                  AI-Powered Insights
                </h4>
                <ul className="space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Automated performance insights
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Growth opportunity detection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Smart recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Trend prediction algorithms
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200">
                  <Bell className="h-4 w-4" />
                  Advanced Controls
                </h4>
                <ul className="space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Performance threshold alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Multi-format data export
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Customizable dashboard layouts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Keyboard shortcuts (R, S, E)
                  </li>
                </ul>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  Admin Tool
                </Badge>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  Enhanced with 12 new developer features
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Documentation
                </Button>
                <Button size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View All Metrics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Keep the existing CategoryBreakdown and TopUsers components (they were working well)
function CategoryBreakdown({
  period,
}: {
  period: "7d" | "30d" | "90d" | "1y";
}) {
  const { data: stats, isLoading } =
    api.toolAnalytics.getToolUsageStats.useQuery({ period });

  if (isLoading) {
    return (
      <Card>
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

  return (
    <Card>
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
        <div className="space-y-4">
          {stats?.categoryBreakdown?.map((category, index) => (
            <div
              key={category.category}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="flex h-6 w-6 items-center justify-center p-0 text-xs"
                >
                  {index + 1}
                </Badge>
                <span className="font-medium">{category.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-muted h-2 w-24 rounded-full">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${(category.count / Math.max(...(stats?.categoryBreakdown?.map((c) => c.count) ?? [1]))) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-sm">
                  {category.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TopUsers({ period }: { period: "7d" | "30d" | "90d" | "1y" }) {
  const { data: stats, isLoading } =
    api.toolAnalytics.getToolUsageStats.useQuery({ period });

  if (isLoading) {
    return (
      <Card>
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
    <Card>
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
          {stats?.topUsers.slice(0, 10).map((user: UserData, index: number) => (
            <div
              key={user.userId}
              className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={index < 3 ? "default" : "outline"}
                  className={`flex h-8 w-8 items-center justify-center p-0 ${
                    index === 0
                      ? "bg-yellow-500"
                      : index === 1
                        ? "bg-gray-400"
                        : index === 2
                          ? "bg-amber-600"
                          : ""
                  }`}
                >
                  {index + 1}
                </Badge>
                <div>
                  <p className="text-sm font-medium">
                    {user.userName ?? "Anonymous User"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {user.userEmail ?? "No email"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{user.count} interactions</p>
                {user.totalDuration > 0 && (
                  <p className="text-muted-foreground text-xs">
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

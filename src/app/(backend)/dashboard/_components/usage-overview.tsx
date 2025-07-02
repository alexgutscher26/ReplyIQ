/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { useState, useMemo, useCallback } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { Download, Eye, EyeOff } from "lucide-react";

interface UsageEntry {
  date: string;
  facebook: number;
  instagram: number;
  linkedin: number;
  twitter: number;
  youtube: number;
  [key: string]: string | number;
}

interface UsageOverviewProps {
  isSiteWide?: boolean;
  className?: string;
}

export const chartConfig = {
  facebook: {
    color: 'hsl(221, 83%, 53%)', // Facebook blue
    label: 'Facebook',
  },
  instagram: {
    color: 'hsl(329, 100%, 49%)', // Instagram pink/purple
    label: 'Instagram',
  },
  linkedin: {
    color: 'hsl(201, 100%, 35%)', // LinkedIn blue
    label: 'LinkedIn',
  },
  twitter: {
    color: 'hsl(203, 89%, 53%)', // Twitter blue
    label: 'Twitter',
  },
  youtube: {
    color: 'hsl(0, 100%, 50%)', // YouTube red
    label: 'YouTube',
  },
} satisfies ChartConfig;

const TIME_RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;

const PLATFORMS = Object.keys(chartConfig) as Array<keyof typeof chartConfig>;

// Utility function to format dates consistently
const formatDate = (dateString: string, options: Intl.DateTimeFormatOptions) => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", options);
  } catch {
    return dateString;
  }
};

// Enhanced CSV export with better formatting and error handling
const exportToCSV = (data: UsageEntry[], platforms: string[], timeRange: string) => {
  try {
    const header = ["Date", ...platforms.map(p => chartConfig[p as keyof typeof chartConfig]?.label || p)];
    const rows = data.map(entry =>
      [
        formatDate(entry.date, { year: 'numeric', month: '2-digit', day: '2-digit' }),
        ...platforms.map(p => entry[p] ?? 0)
      ].join(",")
    );
    
    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usage-data-${timeRange}-days-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export CSV:', error);
  }
};

// Platform toggle button component
const PlatformToggle = ({ 
  platform, 
  isSelected, 
  onToggle 
}: { 
  platform: keyof typeof chartConfig; 
  isSelected: boolean; 
  onToggle: (platform: string) => void;
}) => {
  const config = chartConfig[platform];
  
  return (
    <button
      type="button"
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-all duration-200 hover:scale-105 ${
        isSelected
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
      }`}
      onClick={() => onToggle(platform)}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Hide' : 'Show'} ${config.label} data`}
    >
      <span
        className="inline-block w-3 h-3 rounded-full border border-white/20"
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />
      {isSelected ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      {config.label}
    </button>
  );
};

// If you have a type, import or define it:
type DailyStats = {
  date: string;
  facebook?: number;
  instagram?: number;
  linkedin?: number;
  twitter?: number;
  youtube?: number;
};

export function UsageOverview({ isSiteWide = false, className = "" }: UsageOverviewProps) {
  const [timeRange, setTimeRange] = useState<string>("30");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(PLATFORMS);
  
  const { data, isLoading, error } = api.generations.getDailyStats.useQuery({
    days: parseInt(timeRange),
    isSiteWide,
  });

  // Memoized data normalization
  const normalizedData: UsageEntry[] = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((entry: DailyStats) => {
      const normalizedEntry: UsageEntry = {
        date: entry.date,
        facebook: 0,
        instagram: 0,
        linkedin: 0,
        twitter: 0,
        youtube: 0
      };
      PLATFORMS.forEach((platform) => {
        const value = entry[platform];
        normalizedEntry[platform] = typeof value === "number" ? value : 0;
      });
      return normalizedEntry;
    }).filter(entry => entry.date);
  }, [data]);

  // Memoized filtered data for chart
  const filteredData = useMemo(() => {
    return normalizedData.map(entry => {
      const filtered: UsageEntry = { date: entry.date } as UsageEntry;
      selectedPlatforms.forEach(platform => {
        filtered[platform] = entry[platform] ?? 0;
      });
      return filtered;
    });
  }, [normalizedData, selectedPlatforms]);

  // Memoized statistics
  const stats = useMemo(() => {
    if (!filteredData.length) return { total: 0, average: 0, peak: 0 };
    
    const total = filteredData.reduce((sum, entry) => {
      return sum + selectedPlatforms.reduce((platformSum, platform) => {
        return platformSum + (typeof entry[platform] === 'number' ? entry[platform] as number : 0);
      }, 0);
    }, 0);
    
    const average = Math.round(total / filteredData.length);
    const peak = Math.max(...filteredData.map(entry => 
      selectedPlatforms.reduce((sum, platform) => 
        sum + (typeof entry[platform] === 'number' ? entry[platform] as number : 0), 0
      )
    ));
    
    return { total, average, peak };
  }, [filteredData, selectedPlatforms]);

  const togglePlatform = useCallback((platform: string) => {
    setSelectedPlatforms(prev => {
      const newSelection = prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform];
      
      // Ensure at least one platform is selected
      return newSelection.length > 0 ? newSelection : [platform];
    });
  }, []);

  const handleExport = useCallback(() => {
    exportToCSV(filteredData, selectedPlatforms, timeRange);
  }, [filteredData, selectedPlatforms, timeRange]);

  // Error state
  if (error) {
    return (
      <Card className={`col-span-full ${className}`}>
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          <CardDescription>
            Failed to load usage statistics. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Unable to fetch data from the server.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!isLoading && (!normalizedData || normalizedData.length === 0)) {
    return (
      <Card className={`col-span-full ${className}`}>
        <CardHeader>
          <CardTitle>Daily Usage Trends</CardTitle>
          <CardDescription>
            No usage data available for the selected period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>No data to display for the last {timeRange} days.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`col-span-full ${className}`} aria-label="Usage Overview Dashboard">
      <CardHeader className="flex flex-col gap-4 space-y-0 border-b py-4 sm:flex-row sm:items-center sm:py-5">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle className="text-lg sm:text-xl">Daily Usage Trends</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isSiteWide ? 'Site-wide' : 'Personal'} generation statistics across social media platforms
          </CardDescription>
          {!isLoading && stats.total > 0 && (
            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
              <span>Total: <strong>{stats.total.toLocaleString()}</strong></span>
              <span>Avg/day: <strong>{stats.average.toLocaleString()}</strong></span>
              <span>Peak: <strong>{stats.peak.toLocaleString()}</strong></span>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Select value={timeRange} onValueChange={setTimeRange} aria-label="Select time range">
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isLoading || !filteredData.length || selectedPlatforms.length === 0}
            aria-label="Export filtered data as CSV"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {/* Platform filter controls */}
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Platform visibility controls">
          {PLATFORMS.map((platform) => (
            <PlatformToggle
              key={platform}
              platform={platform}
              isSelected={selectedPlatforms.includes(platform)}
              onToggle={togglePlatform}
            />
          ))}
        </div>

        {/* Chart area */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-64 rounded-md" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-[4/3] w-full sm:aspect-[3/1]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {selectedPlatforms.map((platform) => {
                    const typedPlatform = platform as keyof typeof chartConfig;
                    return (
                      <linearGradient
                        key={platform}
                        id={`fill${platform}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={chartConfig[typedPlatform].color}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={chartConfig[typedPlatform].color}
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: string) => formatDate(value, { month: "short", day: "numeric" })}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: number) => value.toLocaleString()}
                />
                <ChartTooltip
                  cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value: string) => formatDate(value, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      indicator="dot"
                    />
                  }
                />
                {selectedPlatforms.map((platform) => {
                  const typedPlatform = platform as keyof typeof chartConfig;
                  return (
                    <Area
                      key={platform}
                      dataKey={platform}
                      type="monotone"
                      fill={`url(#fill${platform})`}
                      fillOpacity={0.6}
                      stroke={chartConfig[typedPlatform].color}
                      strokeWidth={2}
                      stackId="usage"
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
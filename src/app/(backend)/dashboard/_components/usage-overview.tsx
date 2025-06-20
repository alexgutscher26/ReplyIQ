"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { useState } from "react";

const chartConfig = {
  facebook: {
    label: "Facebook",
    color: "var(--chart-1)",
  },
  twitter: {
    label: "Twitter",
    color: "var(--chart-2)",
  },
  linkedin: {
    label: "LinkedIn",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function UsageOverview({
  isSiteWide = false,
}: {
  isSiteWide?: boolean;
}) {
  const [timeRange, setTimeRange] = useState("30");
  const [data] = api.generations.getDailyStats.useSuspenseQuery({
    days: parseInt(timeRange),
    isSiteWide,
  });

  return (
    <Card className="col-span-full">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Daily Usage Trends</CardTitle>
          <CardDescription>
            Showing daily generation statistics across platforms
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto">
            <SelectValue placeholder="Last 30 days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-3/1 w-full">
          <AreaChart data={data}>
            <defs>
              {Object.entries(chartConfig).map(([key, config]) => (
                <linearGradient
                  key={key}
                  id={`fill${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={config.color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={config.color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value: string) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            {Object.entries(chartConfig).map(([key, config]) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill={`url(#fill${key})`}
                stroke={config.color}
                stackId={key} // Add unique stackId to prevent stacking
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

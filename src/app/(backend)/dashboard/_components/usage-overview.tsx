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
import { api } from "@/trpc/react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
} from "recharts";

export const chartConfig = {
  facebook: {
    color: 'hsl(var(--chart-1))',
    label: 'Facebook',
  },
  instagram: {
    color: 'hsl(var(--chart-2))',
    label: 'Instagram',
  },
  linkedin: {
    color: 'hsl(var(--chart-3))',
    label: 'LinkedIn',
  },
  twitter: {
    color: 'hsl(var(--chart-4))',
    label: 'Twitter',
  },
  youtube: {
    color: 'hsl(var(--chart-5))',
    label: 'YouTube',
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
      <CardHeader className="flex flex-col gap-4 space-y-0 border-b py-4 sm:flex-row sm:items-center sm:py-5">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle className="text-lg sm:text-xl">Daily Usage Trends</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Showing daily generation statistics across platforms
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-[160px] sm:ml-auto">
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
        <ChartContainer config={chartConfig} className="aspect-[4/3] w-full sm:aspect-[3/1]">
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
              tick={{ fontSize: 12 }}
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
            <Area
              dataKey="facebook"
              type="natural"
              fill="url(#fillfacebook)"
              fillOpacity={0.4}
              stroke="var(--color-facebook)"
              stackId="a"
            />
            <Area
              dataKey="twitter"
              type="natural"
              fill="url(#filltwitter)"
              fillOpacity={0.4}
              stroke="var(--color-twitter)"
              stackId="a"
            />
            <Area
              dataKey="linkedin"
              type="natural"
              fill="url(#filllinkedin)"
              fillOpacity={0.4}
              stroke="var(--color-linkedin)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

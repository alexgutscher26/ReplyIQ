'use client'

import type { ChartConfig } from '@/components/ui/chart'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router'
import { Label, Pie, PieChart } from 'recharts'
import { z } from 'zod'

import { trpcReact } from '../../background'

export const chartConfig = {
  facebook: {
    color: 'var(--chart-1)',
    label: 'Facebook',
  },
  linkedin: {
    color: 'var(--chart-3)',
    label: 'LinkedIn',
  },
  total: {
    color: 'var(--chart-0)',
    label: 'Generations',
  },
  twitter: {
    color: 'var(--chart-2)',
    label: 'Twitter',
  },
} satisfies ChartConfig

export const result = z.object({
  currentMonth: z.string(),
  currentMonthTotal: z.number(),
  planLimit: z.number(),
  sources: z.array(z.object({
    source: z.string(),
    total: z.number(),
  })),
})

export function Dashboard() {
  const [usage] = trpcReact.usage.useSuspenseQuery<z.infer<typeof result>>()

  const totalGenerations = React.useMemo(() => {
    if (!usage?.sources || !Array.isArray(usage.sources))
      return 0

    return usage.sources.reduce<number>(
      (acc, curr) => acc + (curr.total ?? 0),
      0,
    )
  }, [usage])

  const chartData = React.useMemo(() => {
    if (!usage?.sources || !Array.isArray(usage.sources))
      return []

    return usage.sources.map(item => ({
      fill:
                chartConfig[item.source as keyof typeof chartConfig]?.color
                ?? 'var(--chart-1)',
      source: item.source ?? 'facebook | twitter | linkedin',
      total: item.total ?? 0,
    }))
  }, [usage])

  // Calculate usage percentage
  const usagePercentage = React.useMemo(() => {
    if (!usage?.planLimit || usage.planLimit === 0)
      return 0
    return Math.round(
      (usage.currentMonthTotal / usage.planLimit) * 100,
    )
  }, [usage])

  // Check if usage is high (80% or more)
  const isHighUsage = usagePercentage >= 80

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm">Social Media Distribution</CardTitle>
        <CardDescription>
          {`Usage for ${usage?.currentMonth} ${new Date().getFullYear()}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          className="mx-auto aspect-square max-h-[250px]"
          config={chartConfig}
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={false}
            />
            <Pie
              data={chartData}
              dataKey="total"
              innerRadius={60}
              nameKey="source"
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        dominantBaseline="middle"
                        textAnchor="middle"
                        x={viewBox.cx}
                        y={viewBox.cy}
                      >
                        <tspan
                          className="fill-foreground text-3xl font-bold"
                          x={viewBox.cx}
                          y={viewBox.cy}
                        >
                          {totalGenerations.toLocaleString()}
                        </tspan>
                        <tspan
                          className="fill-muted-foreground"
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 24}
                        >
                          Generations
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {usage?.currentMonthTotal ?? 0}
          /
          {usage?.planLimit ?? 0}
          {' '}
          used this month (
          {usagePercentage}
          %)
          {isHighUsage
            ? (
                <AlertTriangle className="text-warning h-4 w-4" />
              )
            : (
                <TrendingUp className="h-4 w-4" />
              )}
        </div>
        <div className="text-muted-foreground leading-none">
          {usage?.currentMonth ?? 'Current'}
          {' '}
          usage across platforms
        </div>

        {isHighUsage && (
          <Link target="_blank" to={new URL('/', import.meta.env.WXT_SITE_URL).href}>
            <Button className="mt-2" size="sm" variant="outline">
              Upgrade Plan for More Generations
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}

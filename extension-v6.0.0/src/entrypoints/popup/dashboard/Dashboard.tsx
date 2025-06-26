'use client'

import type { ChartConfig } from '@/components/ui/chart'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { AlertTriangle, BarChart3, Calendar, Download, Info, MessageSquare, TrendingDown, TrendingUp } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router'
import { Cell, Label, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { z } from 'zod'

import { trpcReact } from '../../background'
import { ThreadGenerator } from '../thread-generator/ThreadGenerator'

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

// Enhanced chart colors with hover states
const RADIAN = Math.PI / 180

export function Dashboard() {
  const [activeTab, setActiveTab] = React.useState<'analytics' | 'thread-generator'>('analytics')

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Tab Navigation */}
      <div className="flex bg-muted/30 rounded-lg p-1 mb-3">
        <Button
          className={`flex-1 h-8 text-xs ${
            activeTab === 'analytics'
              ? 'bg-background shadow-sm'
              : 'bg-transparent hover:bg-muted/50'
          }`}
          onClick={() => setActiveTab('analytics')}
          size="sm"
          variant="ghost"
        >
          <BarChart3 className="h-3 w-3 mr-1" />
          Analytics
        </Button>
        <Button
          className={`flex-1 h-8 text-xs ${
            activeTab === 'thread-generator'
              ? 'bg-background shadow-sm'
              : 'bg-transparent hover:bg-muted/50'
          }`}
          onClick={() => setActiveTab('thread-generator')}
          size="sm"
          variant="ghost"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Thread Generator
        </Button>
      </div>

      {/* Tab Content */}
      <div className="min-h-0">
        {activeTab === 'analytics' && <UsageAnalytics />}
        {activeTab === 'thread-generator' && <ThreadGenerator />}
      </div>
    </div>
  )
}

function renderCustomizedLabel({
  cx,
  cy,
  innerRadius,
  midAngle,
  outerRadius,
  percentage,
}: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  // Don't show labels for slices less than 5%
  if (!percentage || Number.parseFloat(percentage) < 5)
    return null

  return (
    <text
      className="text-xs font-medium"
      dominantBaseline="central"
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      x={x}
      y={y}
    >
      {`${Math.round(Number.parseFloat(percentage))}%`}
    </text>
  )
}

function UsageAnalytics() {
  const [usage] = trpcReact.usage.useSuspenseQuery<z.infer<typeof result>>()
  const [hoveredSection, setHoveredSection] = React.useState<null | string>(null)
  const [isExporting, setIsExporting] = React.useState(false)

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
      percentage: totalGenerations > 0 ? ((item.total ?? 0) / totalGenerations * 100).toFixed(1) : '0',
      source: item.source ?? 'facebook | twitter | linkedin',
      total: item.total ?? 0,
    }))
  }, [usage, totalGenerations])

  // Calculate usage percentage
  const usagePercentage = React.useMemo(() => {
    if (!usage?.planLimit || usage.planLimit === 0)
      return 0
    return Math.round(
      (totalGenerations / usage.planLimit) * 100,
    )
  }, [usage, totalGenerations])

  // Check if usage is high (80% or more)
  const isHighUsage = usagePercentage >= 80
  const isMediumUsage = usagePercentage >= 50 && usagePercentage < 80

  // Usage insights and predictions
  const usageInsights = React.useMemo(() => {
    const remaining = (usage?.planLimit ?? 0) - totalGenerations
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const currentDay = new Date().getDate()
    const daysRemaining = daysInMonth - currentDay
    const dailyAverage = currentDay > 0 ? totalGenerations / currentDay : 0
    const projectedTotal = dailyAverage * daysInMonth

    return {
      dailyAverage: Math.round(dailyAverage * 10) / 10,
      daysRemaining,
      onTrackForLimit: projectedTotal <= (usage?.planLimit ?? 0),
      projectedTotal: Math.round(projectedTotal),
      remaining,
    }
  }, [usage, totalGenerations])

  // Export functionality
  const handleExport = React.useCallback(async () => {
    setIsExporting(true)
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        insights: usageInsights,
        month: usage?.currentMonth,
        planLimit: usage?.planLimit,
        sources: usage?.sources,
        totalUsage: usage?.currentMonthTotal,
        usagePercentage,
        year: new Date().getFullYear(),
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })

      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `usage-report-${usage?.currentMonth}-${new Date().getFullYear()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
    catch (error) {
      console.error('Export failed:', error)
    }
    finally {
      setIsExporting(false)
    }
  }, [usage, usagePercentage, usageInsights])

  // Get usage status styling
  const getUsageStatusColor = () => {
    if (isHighUsage)
      return 'text-red-600 dark:text-red-400'
    if (isMediumUsage)
      return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getUsageStatusIcon = () => {
    if (isHighUsage)
      return <AlertTriangle className="h-4 w-4" />
    if (isMediumUsage)
      return <TrendingDown className="h-4 w-4" />
    return <TrendingUp className="h-4 w-4" />
  }

  return (
    <Card className="flex flex-col transition-all duration-200 hover:shadow-lg">
      <CardHeader className="items-center pb-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Social Media Distribution</CardTitle>
            <Info className="h-3 w-3 text-muted-foreground" />
          </div>
          <Button
            aria-label="Export usage data"
            className="h-7 px-2"
            disabled={isExporting}
            onClick={handleExport}
            size="sm"
            variant="outline"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-center">
          {`Usage for ${usage?.currentMonth} ${new Date().getFullYear()}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-2">
        <ChartContainer
          className="mx-auto aspect-square max-h-[220px]"
          config={chartConfig}
        >
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-background border rounded-lg shadow-md p-3">
                        <p className="font-medium">{data.source}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.total}
                          {' '}
                          generations (
                          {data.percentage}
                          %)
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
                cursor={false}
              />
              <Pie
                className="focus:outline-none"
                data={chartData}
                dataKey="total"
                innerRadius={50}
                label={renderCustomizedLabel}
                labelLine={false}
                nameKey="source"
                onMouseEnter={(_, index) => {
                  setHoveredSection(chartData[index]?.source || null)
                }}
                onMouseLeave={() => setHoveredSection(null)}
                outerRadius={80}
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    className="transition-all duration-200 cursor-pointer focus:outline-none"
                    fill={entry.fill}
                    key={`cell-${index}`}
                    stroke={hoveredSection === entry.source ? 'rgba(255,255,255,0.8)' : 'transparent'}
                    strokeWidth={hoveredSection === entry.source ? 2 : 0}
                    style={{
                      filter: hoveredSection && hoveredSection !== entry.source ? 'brightness(0.7)' : 'brightness(1)',
                    }}
                  />
                ))}
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
                            className="fill-foreground text-2xl font-bold"
                            x={viewBox.cx}
                            y={viewBox.cy}
                          >
                            {totalGenerations.toLocaleString()}
                          </tspan>
                          <tspan
                            className="fill-muted-foreground text-xs"
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 16}
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
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-3 text-sm pt-2">
        {/* Usage Statistics */}
        <div className={`flex items-center gap-2 leading-none font-medium ${getUsageStatusColor()}`}>
          {totalGenerations}
          /
          {usage?.planLimit ?? 0}
          {' '}
          used this month (
          {usagePercentage}
          %)
          {getUsageStatusIcon()}
        </div>

        {/* Usage Insights */}
        <div className="grid grid-cols-2 gap-3 w-full text-xs">
          <div className="text-center p-2 bg-muted/30 rounded-md">
            <div className="font-medium">{usageInsights.remaining}</div>
            <div className="text-muted-foreground">Remaining</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-md">
            <div className="font-medium">{usageInsights.dailyAverage}</div>
            <div className="text-muted-foreground">Daily Avg</div>
          </div>
        </div>

        {/* Usage Prediction */}
        {usageInsights.daysRemaining > 0 && (
          <div className="text-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 inline mr-1" />
            {usageInsights.onTrackForLimit
              ? `On track to use ~${usageInsights.projectedTotal} this month`
              : `Projected to exceed limit by ~${usageInsights.projectedTotal - (usage?.planLimit ?? 0)}`}
          </div>
        )}

        <div className="text-muted-foreground leading-none text-center text-xs">
          {usage?.currentMonth ?? 'Current'}
          {' '}
          usage across platforms
        </div>

        {/* Platform Breakdown */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-3 gap-2 w-full text-xs">
            {chartData.map((item, index) => (
              <div className="text-center" key={index}>
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: item.fill }}
                />
                <div className="font-medium capitalize">{item.source}</div>
                <div className="text-muted-foreground">{item.total}</div>
              </div>
            ))}
          </div>
        )}

        {isHighUsage && (
          <Link target="_blank" to={new URL('/', import.meta.env.WXT_SITE_URL).href}>
            <Button className="mt-2 w-full" size="sm" variant="outline">
              <TrendingUp className="h-3 w-3 mr-1" />
              Upgrade Plan for More Generations
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}

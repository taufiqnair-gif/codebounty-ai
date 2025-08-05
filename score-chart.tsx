"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { Pie, PieChart } from "recharts"

interface ScoreChartProps {
  score: number
  className?: string
}

export function ScoreChart({ score, className }: ScoreChartProps) {
  const data = [
    { name: "Score", value: score, fill: "var(--color-primary)" },
    { name: "Remaining", value: 100 - score, fill: "var(--color-muted)" },
  ]

  const chartConfig = {
    score: {
      label: "Score",
      color: "hsl(var(--primary))",
    },
    remaining: {
      label: "Remaining",
      color: "hsl(var(--muted))",
    },
  } as const

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <ChartContainer config={chartConfig} className="h-48 w-48">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={80}
            strokeWidth={2}
            cornerRadius={5}
          />
        </PieChart>
      </ChartContainer>
      <div className="mt-4 text-center">
        <p className="text-5xl font-bold text-cyber-glow">
          {score}
          <span className="text-3xl">%</span>
        </p>
        <p className="text-lg text-muted-foreground">Security Score</p>
      </div>
    </div>
  )
}

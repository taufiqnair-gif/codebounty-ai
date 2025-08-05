"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface ScoreChartProps {
  score: number
  size?: number
  strokeWidth?: number
}

export function ScoreChart({ score, size = 120, strokeWidth = 10 }: ScoreChartProps) {
  const circumference = 2 * Math.PI * (size / 2 - strokeWidth / 2)
  const offset = circumference - (score / 100) * circumference
  const svgRef = useRef<SVGSVGElement>(null)

  const getColor = (s: number) => {
    if (s >= 80) return "#22c55e" // Green for high score
    if (s >= 50) return "#eab308" // Yellow for medium score
    return "#ef4444" // Red for low score
  }

  const scoreColor = getColor(score)

  useEffect(() => {
    if (svgRef.current) {
      const circle = svgRef.current.querySelector("circle:last-child") as SVGCircleElement
      if (circle) {
        circle.style.strokeDashoffset = `${offset}`
        circle.style.stroke = scoreColor
      }
    }
  }, [score, offset, scoreColor])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg ref={svgRef} className="transform -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - strokeWidth / 2}
          fill="transparent"
          stroke="#333"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - strokeWidth / 2}
          fill="transparent"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease-in-out, stroke 0.5s ease-in-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold", `text-[${scoreColor}]`)} style={{ color: scoreColor }}>
          {score}
        </span>
        <span className="text-sm text-muted-foreground">Score</span>
      </div>
    </div>
  )
}

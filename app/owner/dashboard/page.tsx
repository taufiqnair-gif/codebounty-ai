"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getBounties } from "@/lib/bounty-service"
import type { Bounty } from "@/types/bounty"
import { Loader2, DollarSign, Target, CheckCircle, Clock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BountyStatus } from "@/types/bounty"

export default function OwnerDashboardPage() {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBounties = async () => {
      setLoading(true)
      setError(null)
      try {
        const fetchedBounties = await getBounties()
        setBounties(fetchedBounties)
      } catch (err) {
        console.error("Failed to fetch bounties:", err)
        setError("Failed to load bounties. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchBounties()
  }, [])

  const openBounties = bounties.filter((b) => b.status === BountyStatus.Open).length
  const closedBounties = bounties.filter((b) => b.status === BountyStatus.Closed).length
  const totalSubmissions = bounties.reduce((sum, b) => sum + b.submissions.length, 0)
  const approvedSubmissions = bounties.reduce(
    (sum, b) => sum + b.submissions.filter((s) => s.status === "Approved").length,
    0,
  )

  const totalRewardValue = bounties.reduce((sum, b) => {
    const match = b.reward.match(/(\d+(\.\d+)?)\s*(USDC|ETH|DAI|BOUNTY)/)
    if (match) {
      return sum + Number.parseFloat(match[1])
    }
    return sum
  }, 0)

  const data = [
    { name: "Open", value: openBounties },
    { name: "Closed", value: closedBounties },
    { name: "Submissions", value: totalSubmissions },
    { name: "Approved", value: approvedSubmissions },
  ]

  const chartConfig = {
    value: {
      label: "Count",
      color: "hsl(var(--primary))",
    },
    Open: {
      label: "Open Bounties",
      color: "hsl(142.1 76.2% 36.3%)", // Green
    },
    Closed: {
      label: "Closed Bounties",
      color: "hsl(0 84.2% 60.2%)", // Red
    },
    Submissions: {
      label: "Total Submissions",
      color: "hsl(217.2 91.2% 59.8%)", // Blue
    },
    Approved: {
      label: "Approved Submissions",
      color: "hsl(280 80% 60%)", // Purple
    },
  } as const

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-destructive">
        <p className="text-lg">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">Owner Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Rewards Posted</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">${totalRewardValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Open Bounties</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{openBounties}</div>
            <p className="text-xs text-muted-foreground">+5 new this week</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Closed Bounties</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{closedBounties}</div>
            <p className="text-xs text-muted-foreground">+10 closed this month</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Avg. Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">3 Days</div>
            <p className="text-xs text-muted-foreground">Across all bounties</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Bounty Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={data}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  className="text-sm text-muted-foreground"
                />
                <YAxis tickLine={false} tickMargin={10} axisLine={false} className="text-sm text-muted-foreground" />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {bounties
              .flatMap((bounty) =>
                bounty.submissions.map((submission) => ({
                  ...submission,
                  bountyTitle: bounty.title,
                  bountyId: bounty.id,
                })),
              )
              .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
              .slice(0, 5) // Show top 5 recent submissions
              .map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between py-3 border-b border-gray-800 last:border-b-0"
                >
                  <div>
                    <p className="text-white font-medium">{submission.bountyTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      By {submission.hunterAddress.slice(0, 6)}...{submission.hunterAddress.slice(-4)}
                    </p>
                  </div>
                  <Badge
                    className={
                      submission.status === "Approved"
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                        : submission.status === "Pending"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                    }
                  >
                    {submission.status}
                  </Badge>
                </div>
              ))}
            {totalSubmissions === 0 && <p className="text-muted-foreground text-center py-4">No submissions yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { cn } from "@/lib/utils"

import { CardDescription } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, DollarSign, Target, CheckCircle, Clock, Users, Trophy } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BountyService } from "@/lib/bounty-service"
import { AuditService } from "@/lib/audit-service"
import type { Bounty } from "@/types/bounty"
import { BountyStatus } from "@/constants/bountyStatus"
import { useWallet } from "@/hooks/use-wallet"

interface HunterStats {
  address: string
  bountiesCompleted: number
  totalRewardEarned: number
  averageQualityScore: number
}

export default function OwnerLeaderboardAnalyticsPage() {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [auditStats, setAuditStats] = useState({
    totalAudits: 0,
    completedAudits: 0,
    averageScore: 0,
    highRiskAudits: 0,
  })
  const [hunterStats, setHunterStats] = useState<HunterStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { provider, isConnected } = useWallet()

  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !provider) {
        setLoading(false)
        setError("Please connect your wallet to view dashboard data.")
        return
      }

      setLoading(true)
      setError(null)
      try {
        const bountyService = new BountyService(provider)
        const auditService = new AuditService(provider)

        const fetchedBounties = await bountyService.getBounties()
        setBounties(fetchedBounties)

        const fetchedAuditStats = await auditService.getAuditStats()
        setAuditStats(fetchedAuditStats)

        // Calculate hunter stats
        const hunterMap = new Map<string, { completed: number; reward: number; qualitySum: number; count: number }>()
        fetchedBounties.forEach((bounty) => {
          bounty.submissions.forEach((submission) => {
            if (submission.status === "Approved") {
              const hunterAddress = submission.hunterAddress.toLowerCase()
              const current = hunterMap.get(hunterAddress) || { completed: 0, reward: 0, qualitySum: 0, count: 0 }
              const rewardMatch = bounty.reward.match(/(\d+(\.\d+)?)\s*BTY/)
              const rewardValue = rewardMatch ? Number.parseFloat(rewardMatch[1]) : 0

              hunterMap.set(hunterAddress, {
                completed: current.completed + 1,
                reward: current.reward + rewardValue,
                qualitySum: current.qualitySum + 90, // Mock quality score for now
                count: current.count + 1,
              })
            }
          })
        })

        const calculatedHunterStats: HunterStats[] = Array.from(hunterMap.entries()).map(([address, data]) => ({
          address,
          bountiesCompleted: data.completed,
          totalRewardEarned: data.reward,
          averageQualityScore: data.count > 0 ? data.qualitySum / data.count : 0,
        }))
        setHunterStats(calculatedHunterStats.sort((a, b) => b.totalRewardEarned - a.totalRewardEarned))
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
        setError("Failed to load dashboard. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isConnected, provider])

  const openBountiesCount = bounties.filter((b) => b.status === BountyStatus.Open).length
  const closedBountiesCount = bounties.filter((b) => b.status === BountyStatus.Closed).length
  const totalSubmissions = bounties.reduce((sum, b) => sum + b.submissions.length, 0)
  const approvedSubmissions = bounties.reduce(
    (sum, b) => sum + b.submissions.filter((s) => s.status === "Approved").length,
    0,
  )

  const totalRewardValue = bounties.reduce((sum, b) => {
    const match = b.reward.match(/(\d+(\.\d+)?)\s*(BTY)/)
    if (match) {
      return sum + Number.parseFloat(match[1])
    }
    return sum
  }, 0)

  const bountyChartData = [
    { name: "Open", value: openBountiesCount },
    { name: "Closed", value: closedBountiesCount },
    { name: "Submissions", value: totalSubmissions },
    { name: "Approved", value: approvedSubmissions },
  ]

  const bountyChartConfig = {
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
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">Owner Dashboard & Analytics</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto mb-10">
        Gain insights into your bounties, audit performance, and hunter activity.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Rewards Posted</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{totalRewardValue.toFixed(2)} BTY</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Open Bounties</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{openBountiesCount}</div>
            <p className="text-xs text-muted-foreground">+5 new this week</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Closed Bounties</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{closedBountiesCount}</div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Bounty Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={bountyChartConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={bountyChartData}>
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
                <Bar
                  dataKey="value"
                  fill={({ dataKey, value }) =>
                    bountyChartConfig[dataKey as keyof typeof bountyChartConfig]?.color || "hsl(var(--primary))"
                  }
                  radius={8}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">AI Audit Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-md bg-gray-800/50 border border-gray-700">
                <p className="text-sm text-muted-foreground">Total Audits</p>
                <p className="text-2xl font-bold text-white">{auditStats.totalAudits}</p>
              </div>
              <div className="p-4 rounded-md bg-gray-800/50 border border-gray-700">
                <p className="text-sm text-muted-foreground">Avg. Score</p>
                <p className="text-2xl font-bold text-blue-400">{auditStats.averageScore.toFixed(1)}</p>
              </div>
              <div className="p-4 rounded-md bg-gray-800/50 border border-gray-700">
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-red-400">{auditStats.highRiskAudits}</p>
              </div>
              <div className="p-4 rounded-md bg-gray-800/50 border border-gray-700">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-400">{auditStats.completedAudits}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Detailed AI audit results can be found in the "AI Audit Dashboard" tab.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-cyber">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <Users className="h-5 w-5" /> Top Hunters Leaderboard
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Recognizing the most active and successful bounty hunters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hunterStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hunter data available yet.</p>
          ) : (
            <div className="space-y-3">
              {hunterStats.map((hunter, index) => (
                <div
                  key={hunter.address}
                  className="flex items-center justify-between p-3 rounded-md bg-gray-900/30 border border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary w-6 text-right">#{index + 1}</span>
                    <Trophy
                      className={cn(
                        "h-5 w-5",
                        index === 0 && "text-yellow-400",
                        index === 1 && "text-gray-400",
                        index === 2 && "text-amber-600",
                      )}
                    />
                    <span className="font-mono text-white">
                      {hunter.address.slice(0, 6)}...{hunter.address.slice(-4)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {hunter.totalRewardEarned.toFixed(2)} <span className="text-sm text-green-400">BTY</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{hunter.bountiesCompleted} bounties completed</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

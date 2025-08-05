"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Trophy, Award, Users } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { ContractService } from "@/lib/contract-service"
import { useToast } from "@/hooks/use-toast"
import { Badge as BadgeComponent } from "@/components/ui/badge"

interface HunterRanking {
  address: string
  totalRewardEarned: number
  bountiesCompleted: number
  averageQualityScore: number
}

interface Badge {
  id: string
  name: string
  description: string
  criteria: string
  earned: boolean
  imageUrl: string
}

export default function HunterLeaderboardBadgesPage() {
  const [rankings, setRankings] = useState<HunterRanking[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isConnected, address, provider, signer } = useWallet()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !provider) {
        setLoading(false)
        setError("Please connect your wallet to view leaderboard and badges.")
        return
      }
      setLoading(true)
      setError(null)
      try {
        const contractService = new ContractService(provider, await provider.getSigner())

        // Mock fetching rankings
        const mockRankings: HunterRanking[] = [
          { address: "0xHunterTop1...", totalRewardEarned: 1500, bountiesCompleted: 10, averageQualityScore: 95 },
          { address: "0xHunterTop2...", totalRewardEarned: 1200, bountiesCompleted: 8, averageQualityScore: 92 },
          { address: "0xHunterTop3...", totalRewardEarned: 900, bountiesCompleted: 7, averageQualityScore: 88 },
          { address: "0xHunter4...", totalRewardEarned: 750, bountiesCompleted: 5, averageQualityScore: 85 },
          { address: "0xHunter5...", totalRewardEarned: 600, bountiesCompleted: 4, averageQualityScore: 80 },
        ]
        setRankings(mockRankings.sort((a, b) => b.totalRewardEarned - a.totalRewardEarned))

        // Mock fetching badges and checking if earned
        const mockBadges: Badge[] = [
          {
            id: "badge-001",
            name: "First Bounty Hunter",
            description: "Awarded for completing your first bounty.",
            criteria: "1+ bounty completed",
            earned: false, // Will check dynamically
            imageUrl: "/first-bounty-badge.png",
          },
          {
            id: "badge-002",
            name: "Master Auditor",
            description: "Awarded for achieving a high average quality score across multiple audits.",
            criteria: "Avg Quality Score > 90, 5+ bounties",
            earned: false, // Will check dynamically
            imageUrl: "/placeholder.svg?height=48&width=48",
          },
          {
            id: "badge-003",
            name: "Top Earner",
            description: "Awarded for earning over 1000 BTY in rewards.",
            criteria: "Total Reward > 1000 BTY",
            earned: false, // Will check dynamically
            imageUrl: "/top-earner-badge.png",
          },
        ]

        const userStats = rankings.find((r) => r.address.toLowerCase() === address?.toLowerCase())
        const updatedBadges = mockBadges.map((badge) => {
          let earned = false
          if (userStats) {
            if (badge.id === "badge-001" && userStats.bountiesCompleted >= 1) earned = true
            if (badge.id === "badge-002" && userStats.averageQualityScore > 90 && userStats.bountiesCompleted >= 5)
              earned = true
            if (badge.id === "badge-003" && userStats.totalRewardEarned > 1000) earned = true
          }
          return { ...badge, earned }
        })
        setBadges(updatedBadges)
      } catch (err) {
        console.error("Failed to fetch data:", err)
        setError("Failed to load leaderboard and badges. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isConnected, address, provider])

  const handleClaimBadge = async (badgeId: string) => {
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim badges.",
        variant: "destructive",
      })
      return
    }

    try {
      const contractService = new ContractService(provider!, signer!)
      // In a real scenario, this would call a BountyLeaderboard or AuditNFT contract method to mint the badge
      console.log(`Claiming badge: ${badgeId}`)
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate blockchain tx

      setBadges((prev) => prev.map((b) => (b.id === badgeId ? { ...b, earned: true } : b)))
      toast({
        title: "Badge Claimed!",
        description: "Your new badge has been successfully minted to your profile.",
      })
    } catch (error) {
      console.error("Failed to claim badge:", error)
      toast({
        title: "Error",
        description: "Failed to claim badge. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">Loading leaderboard and badges...</span>
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
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">Hunter Leaderboard & Badges</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto mb-10">
        See how you rank among other hunters and claim your earned reputation badges.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <Users className="h-5 w-5" /> Top Hunters Leaderboard
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Rankings based on total rewards earned and bounties completed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rankings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hunter data available yet.</div>
            ) : (
              <div className="space-y-3">
                {rankings.map((hunter, index) => (
                  <div
                    key={hunter.address}
                    className="p-4 border border-gray-700 rounded-md bg-gray-900/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary w-6 text-right">#{index + 1}</span>
                      <Trophy
                        className={`h-5 w-5 ${
                          index === 0
                            ? "text-yellow-400"
                            : index === 1
                              ? "text-gray-400"
                              : index === 2
                                ? "text-amber-600"
                                : ""
                        }`}
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

        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <Award className="h-5 w-5" /> Your Earned Badges
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Claim your Soulbound Token (SBT) badges for your achievements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected || !address ? (
              <div className="text-center py-8 text-muted-foreground">Connect your wallet to see your badges.</div>
            ) : badges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No badges available yet.</div>
            ) : (
              badges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-4 border border-gray-700 rounded-md bg-gray-900/30 flex items-center gap-4"
                >
                  <img src={badge.imageUrl || "/placeholder.svg"} alt={badge.name} className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    <p className="text-xs text-gray-500">Criteria: {badge.criteria}</p>
                  </div>
                  {badge.earned ? (
                    <BadgeComponent className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      Claimed
                    </BadgeComponent>
                  ) : (
                    <Button
                      size="sm"
                      className="btn-cyber-primary"
                      onClick={() => handleClaimBadge(badge.id)}
                      disabled={!isConnected}
                    >
                      Claim Badge
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

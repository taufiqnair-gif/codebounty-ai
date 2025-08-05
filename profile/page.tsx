"use client"

import { CardDescription } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Award, Trophy, Star, CheckCircle, DollarSign, Calendar, Zap, Target } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { HunterConfigPanel } from "@/components/hunter-config-panel"
import { autoBountyManagerService, contractEventService } from "@/lib/contract-service"
import type { HunterParams } from "@/types/contracts"
import { Loader2 } from "lucide-react"

interface AuditNFT {
  id: string
  contractAddress: string
  score: number
  issuesFixed: number
  imageUrl: string
  mintDate: string
  qualityScore: number
  xpEarned: number
}

interface RewardHistory {
  bountyId: string
  reward: number
  date: string
  status: "Paid" | "Pending"
  issueType: string
  qualityScore: number
  xpMultiplier: number
}

export default function ProfilePage() {
  const [auditNFTs, setAuditNFTs] = useState<AuditNFT[]>([])
  const [rewardHistory, setRewardHistory] = useState<RewardHistory[]>([])
  const [hunterParams, setHunterParams] = useState<HunterParams>(autoBountyManagerService.getParams())
  const [userStats, setUserStats] = useState({
    totalXP: 2450,
    currentRank: "Security Expert",
    nextRankXP: 3000,
    totalEarned: 1.25,
    bountiesCompleted: 8,
    averageScore: 87,
    averageQualityScore: 84,
    commitRevealSuccess: 95,
  })
  const { toast } = useToast()
  const { address, isConnected, isLoading } = useWallet()

  useEffect(() => {
    if (!isConnected) return

    // Mock data
    setTimeout(() => {
      setAuditNFTs([
        {
          id: "nft-1",
          contractAddress: "0xAb...Cd",
          score: 92,
          issuesFixed: 3,
          imageUrl: "/security-audit-nft-gold.png",
          mintDate: "2025-08-05",
          qualityScore: 95,
          xpEarned: 380,
        },
        {
          id: "nft-2",
          contractAddress: "0xEf...Gh",
          score: 78,
          issuesFixed: 2,
          imageUrl: "/placeholder-mnego.png",
          mintDate: "2025-08-03",
          qualityScore: 82,
          xpEarned: 246,
        },
        {
          id: "nft-3",
          contractAddress: "0xIj...Kl",
          score: 95,
          issuesFixed: 4,
          imageUrl: "/security-audit-nft-platinum.png",
          mintDate: "2025-08-01",
          qualityScore: 98,
          xpEarned: 480,
        },
      ])

      setRewardHistory([
        {
          bountyId: "5678",
          reward: 0.5,
          date: "2025-08-06",
          status: "Paid",
          issueType: "Reentrancy",
          qualityScore: 95,
          xpMultiplier: 2.0,
        },
        {
          bountyId: "5679",
          reward: 0.25,
          date: "2025-08-04",
          status: "Paid",
          issueType: "Access Control",
          qualityScore: 82,
          xpMultiplier: 1.5,
        },
        {
          bountyId: "5680",
          reward: 0.15,
          date: "2025-08-02",
          status: "Pending",
          issueType: "Integer Overflow",
          qualityScore: 78,
          xpMultiplier: 1.0,
        },
      ])
    }, 1000)

    // Subscribe to contract events
    const handlePatchAssessed = (data: any) => {
      toast({
        title: "Patch Assessed",
        description: `Quality score: ${data.qualityScore}, XP multiplier: ${data.xpMultiplier}x`,
      })
    }

    contractEventService.subscribe("PatchAssessed", handlePatchAssessed)

    return () => {
      contractEventService.unsubscribe("PatchAssessed", handlePatchAssessed)
    }
  }, [isConnected, toast])

  const handleParamsChange = (newParams: HunterParams) => {
    setHunterParams(newParams)
  }

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "Security Expert":
        return "text-purple-400"
      case "Senior Auditor":
        return "text-blue-400"
      case "Junior Auditor":
        return "text-green-400"
      default:
        return "text-gray-400"
    }
  }

  const getXPProgress = () => {
    return (userStats.totalXP / userStats.nextRankXP) * 100
  }

  const getQualityBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500">Excellent</Badge>
    if (score >= 80) return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500">Good</Badge>
    if (score >= 70) return <Badge className="bg-green-500/20 text-green-500 border-green-500">Acceptable</Badge>
    return <Badge className="bg-red-500/20 text-red-500 border-red-500">Poor</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI-Native Hunter Profile
            </span>
          </h1>
          <p className="text-gray-400">Track your achievements, rewards, and AI quality assessments</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-800/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration">Hunter Config</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-gray-800/50 bg-gray-900/20">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{userStats.totalXP}</div>
                  <div className="text-sm text-gray-400">Total XP</div>
                </CardContent>
              </Card>

              <Card className="border-gray-800/50 bg-gray-900/20">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{userStats.totalEarned} ETH</div>
                  <div className="text-sm text-gray-400">Total Earned</div>
                </CardContent>
              </Card>

              <Card className="border-gray-800/50 bg-gray-900/20">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{userStats.bountiesCompleted}</div>
                  <div className="text-sm text-gray-400">Bounties Completed</div>
                </CardContent>
              </Card>

              <Card className="border-gray-800/50 bg-gray-900/20">
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{userStats.averageQualityScore}</div>
                  <div className="text-sm text-gray-400">Avg Quality Score</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - XP & AI Performance */}
              <div className="space-y-6">
                {/* XP Progress */}
                <Card className="border-gray-800/50 bg-gray-900/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                      Experience Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getRankColor(userStats.currentRank)}`}>
                        {userStats.currentRank}
                      </div>
                      <div className="text-sm text-gray-400">Current Rank</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progress to next rank</span>
                        <span className="text-white">
                          {userStats.totalXP} / {userStats.nextRankXP} XP
                        </span>
                      </div>
                      <Progress value={getXPProgress()} className="h-2" />
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-400">
                        {userStats.nextRankXP - userStats.totalXP} XP to Security Master
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Performance Metrics */}
                <Card className="border-gray-800/50 bg-gray-900/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Target className="h-5 w-5 mr-2 text-blue-400" />
                      AI Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Average Quality Score</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{userStats.averageQualityScore}</span>
                          {getQualityBadge(userStats.averageQualityScore)}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Commit-Reveal Success</span>
                        <span className="text-green-400 font-medium">{userStats.commitRevealSuccess}%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Current Parameters</span>
                        <Badge className="bg-purple-500/20 text-purple-500 border-purple-500">
                          Min: {hunterParams.minQualityScore}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-800">
                      <div className="text-sm text-gray-400 mb-2">Quality Distribution</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-purple-400">Excellent (90+)</span>
                          <span className="text-white">40%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-blue-400">Good (80-89)</span>
                          <span className="text-white">35%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-green-400">Acceptable (70-79)</span>
                          <span className="text-white">25%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Rewards */}
                <Card className="border-gray-800/50 bg-gray-900/20">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Rewards</CardTitle>
                    <CardDescription>Your latest bounty rewards with AI assessment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {rewardHistory.slice(0, 5).map((reward) => (
                        <div
                          key={reward.bountyId}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                        >
                          <div>
                            <div className="font-medium text-white">#{reward.bountyId}</div>
                            <div className="text-sm text-gray-400">{reward.issueType}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {getQualityBadge(reward.qualityScore)}
                              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500 text-xs">
                                {reward.xpMultiplier}x XP
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-400">{reward.reward} ETH</div>
                            <Badge
                              className={
                                reward.status === "Paid"
                                  ? "bg-green-500/20 text-green-500 border-green-500"
                                  : "bg-yellow-500/20 text-yellow-500 border-yellow-500"
                              }
                            >
                              {reward.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - NFT Gallery */}
              <div className="lg:col-span-2">
                <Card className="border-gray-800/50 bg-gray-900/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Award className="h-5 w-5 mr-2 text-purple-400" />
                      AI-Assessed Audit NFT Gallery
                    </CardTitle>
                    <CardDescription>Your soulbound achievement NFTs with quality scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {auditNFTs.length === 0 ? (
                      <div className="text-center py-12">
                        <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No NFTs Yet</h3>
                        <p className="text-gray-400">Complete bounties to earn achievement NFTs</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {auditNFTs.map((nft) => (
                          <div
                            key={nft.id}
                            className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50 hover:border-purple-500/50 transition-colors"
                          >
                            <div className="aspect-square overflow-hidden">
                              <img
                                src={nft.imageUrl || "/placeholder.svg"}
                                alt={`Audit NFT ${nft.id}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-white">Audit #{nft.id}</h3>
                                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500">
                                  Score: {nft.score}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-400 space-y-1">
                                <div>Contract: {nft.contractAddress}</div>
                                <div>Issues Fixed: {nft.issuesFixed}</div>
                                <div className="flex items-center justify-between">
                                  <span>Quality Score:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{nft.qualityScore}</span>
                                    {getQualityBadge(nft.qualityScore)}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>XP Earned:</span>
                                  <span className="text-yellow-400 font-medium">{nft.xpEarned}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Minted: {nft.mintDate}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Full Reward History Table */}
            <Card className="border-gray-800/50 bg-gray-900/20">
              <CardHeader>
                <CardTitle className="text-white">Complete Reward History</CardTitle>
                <CardDescription>All your bounty rewards with AI quality assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Bounty ID</TableHead>
                      <TableHead className="text-gray-400">Issue Type</TableHead>
                      <TableHead className="text-gray-400">Quality Score</TableHead>
                      <TableHead className="text-gray-400">XP Multiplier</TableHead>
                      <TableHead className="text-gray-400">Reward</TableHead>
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rewardHistory.map((reward) => (
                      <TableRow key={reward.bountyId} className="border-gray-800">
                        <TableCell className="font-mono text-purple-400">#{reward.bountyId}</TableCell>
                        <TableCell className="text-gray-300">{reward.issueType}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{reward.qualityScore}</span>
                            {getQualityBadge(reward.qualityScore)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">
                            {reward.xpMultiplier}x
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-green-400">{reward.reward} ETH</TableCell>
                        <TableCell className="text-gray-300">{reward.date}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              reward.status === "Paid"
                                ? "bg-green-500/20 text-green-500 border-green-500"
                                : "bg-yellow-500/20 text-yellow-500 border-yellow-500"
                            }
                          >
                            {reward.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration">
            <HunterConfigPanel onParamsChange={handleParamsChange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

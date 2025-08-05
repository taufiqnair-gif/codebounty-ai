"use client"

import { CardDescription } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { AlertTriangle, Clock, Eye, Plus, TrendingUp, Activity, Zap } from "lucide-react"
import Link from "next/link"
import { useWallet } from "@/hooks/use-wallet"
import { OwnerConfigPanel } from "@/components/owner-config-panel"
import { AiAuditTrigger } from "@/components/ai-audit-trigger"
import { Loader2 } from "lucide-react"
import { auditEngineService, contractEventService } from "@/lib/contract-service"
import type { AuditEngineParams } from "@/types/contracts"

interface AuditOverview {
  totalAudits: number
  avgScore: number
  totalIssues: number
  highRiskIssues: number
  mediumRiskIssues: number
  lowRiskIssues: number
  executionTime: string
  autoBountiesCreated: number
}

interface AuditHistory {
  id: string
  contractAddress: string
  score: number
  issues: number
  date: string
  status: "completed" | "pending" | "failed"
  highRisk: number
  mediumRisk: number
  lowRisk: number
  autoBountyTriggered: boolean
  bountiesCreated: number
}

export default function OwnerDashboardPage() {
  const [auditOverview, setAuditOverview] = useState<AuditOverview | null>(null)
  const [auditHistory, setAuditHistory] = useState<AuditHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [auditParams, setAuditParams] = useState<AuditEngineParams>(auditEngineService.getParams())
  const { toast } = useToast()
  const { isConnected, isLoading: walletLoading } = useWallet()

  useEffect(() => {
    if (!walletLoading && isConnected) {
      // Mock data - in real app, fetch from API
      setTimeout(() => {
        setAuditOverview({
          totalAudits: 24,
          avgScore: 78,
          totalIssues: 47,
          highRiskIssues: 8,
          mediumRiskIssues: 23,
          lowRiskIssues: 16,
          executionTime: "12.3s",
          autoBountiesCreated: 12,
        })

        setAuditHistory([
          {
            id: "1234",
            contractAddress: "0xAb...Cd",
            score: 82,
            issues: 5,
            date: "2025-08-05",
            status: "completed",
            highRisk: 0,
            mediumRisk: 2,
            lowRisk: 3,
            autoBountyTriggered: true,
            bountiesCreated: 2,
          },
          {
            id: "1235",
            contractAddress: "0xEf...Gh",
            score: 45,
            issues: 12,
            date: "2025-08-04",
            status: "completed",
            highRisk: 3,
            mediumRisk: 6,
            lowRisk: 3,
            autoBountyTriggered: false,
            bountiesCreated: 0,
          },
          {
            id: "1236",
            contractAddress: "0xIj...Kl",
            score: 91,
            issues: 2,
            date: "2025-08-03",
            status: "completed",
            highRisk: 0,
            mediumRisk: 1,
            lowRisk: 1,
            autoBountyTriggered: true,
            bountiesCreated: 1,
          },
        ])
        setIsLoading(false)
      }, 1000)

      // Subscribe to contract events
      const handleAuditCompleted = (data: any) => {
        toast({
          title: "Audit Completed",
          description: `Audit ${data.auditId} completed with score ${data.finalScore}`,
        })
      }

      const handleBountyCreated = (data: any) => {
        toast({
          title: "Auto-Bounty Created",
          description: `Bounty ${data.bountyId} created for issue ${data.issueId}`,
        })
      }

      contractEventService.subscribe("AuditCompleted", handleAuditCompleted)
      contractEventService.subscribe("BountyCreated", handleBountyCreated)

      return () => {
        contractEventService.unsubscribe("AuditCompleted", handleAuditCompleted)
        contractEventService.unsubscribe("BountyCreated", handleBountyCreated)
      }
    }
  }, [toast, isConnected, walletLoading])

  const handleParamsChange = (newParams: AuditEngineParams) => {
    setAuditParams(newParams)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 50) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500/20 text-green-500 border-green-500">Safe</Badge>
    if (score >= 50) return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">Medium Risk</Badge>
    return <Badge className="bg-red-500/20 text-red-500 border-red-500">High Risk</Badge>
  }

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">Owner Dashboard</h1>

      {!isConnected ? (
        <Card className="card-cyber max-w-md mx-auto text-center p-6">
          <CardTitle className="text-xl text-primary mb-4">Wallet Not Connected</CardTitle>
          <CardContent className="text-muted-foreground">
            Please connect your wallet to access the owner dashboard and manage your CodeBountyAI operations.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="border-gray-800/50 bg-gray-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">{auditOverview?.totalAudits || 0}</div>
                    <Activity className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="text-sm text-gray-400">Total Audits</div>
                </CardContent>
              </Card>

              <Card className="border-gray-800/50 bg-gray-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">
                      <span className={getScoreColor(auditOverview?.avgScore || 0)}>
                        {auditOverview?.avgScore || 0}
                      </span>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="text-sm text-gray-400">Average Score</div>
                </CardContent>
              </Card>

              <Card className="border-gray-800/50 bg-gray-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">{auditOverview?.totalIssues || 0}</div>
                    <AlertTriangle className="h-8 w-8 text-yellow-400" />
                  </div>
                  <div className="text-sm text-gray-400">Total Issues</div>
                </CardContent>
              </Card>

              <Card className="border-gray-800/50 bg-gray-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">{auditOverview?.executionTime || "0s"}</div>
                    <Clock className="h-8 w-8 text-purple-400" />
                  </div>
                  <div className="text-sm text-gray-400">Avg Execution</div>
                </CardContent>
              </Card>

              <Card className="border-gray-800/50 bg-gray-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">{auditOverview?.autoBountiesCreated || 0}</div>
                    <Zap className="h-8 w-8 text-yellow-400" />
                  </div>
                  <div className="text-sm text-gray-400">Auto Bounties</div>
                </CardContent>
              </Card>
            </div>

            {/* AI-Native Status */}
            <Card className="border-gray-800/50 bg-gray-900/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                  AI-Native Automation Status
                </CardTitle>
                <CardDescription>Current configuration and automation status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Auto Bounty Creation</span>
                      <Badge
                        className={
                          auditParams.autoBountyEnabled
                            ? "bg-green-500/20 text-green-500 border-green-500"
                            : "bg-red-500/20 text-red-500 border-red-500"
                        }
                      >
                        {auditParams.autoBountyEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">High Risk Threshold</span>
                      <span className="text-white font-medium">{auditParams.highRiskThreshold}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Default Reward</span>
                      <span className="text-white font-medium">{auditParams.bountyDefaultReward} ETH</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Max Bounties/Audit</span>
                      <span className="text-white font-medium">{auditParams.maxBountiesPerAudit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Callback Gas Limit</span>
                      <span className="text-white font-medium">{auditParams.callbackGasLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Batch Size</span>
                      <span className="text-white font-medium">{auditParams.batchSize}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-400 mb-2">Recent AI Actions</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-300">Auto-bounty created for audit #1234</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-300">Audit completed: score 82</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-300">Parallel batch processed: 47 audits</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit History */}
            <Card className="border-gray-800/50 bg-gray-900/20">
              <CardHeader>
                <CardTitle className="text-white">Audit History</CardTitle>
                <CardDescription>Track all your contract audits and automated bounty creation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-gray-400">Audit ID</TableHead>
                        <TableHead className="text-gray-400">Contract</TableHead>
                        <TableHead className="text-gray-400">Score</TableHead>
                        <TableHead className="text-gray-400">Issues</TableHead>
                        <TableHead className="text-gray-400">Auto Bounties</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                        <TableHead className="text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditHistory.map((audit) => (
                        <TableRow key={audit.id} className="border-gray-800">
                          <TableCell className="font-mono text-blue-400">#{audit.id}</TableCell>
                          <TableCell className="font-mono text-gray-300">{audit.contractAddress}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${getScoreColor(audit.score)}`}>{audit.score}</span>
                              {audit.score >= 80 ? "🟢" : audit.score >= 50 ? "🟡" : "🔴"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {audit.highRisk > 0 && (
                                <Badge className="bg-red-500/20 text-red-500 border-red-500 text-xs">
                                  {audit.highRisk}H
                                </Badge>
                              )}
                              {audit.mediumRisk > 0 && (
                                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500 text-xs">
                                  {audit.mediumRisk}M
                                </Badge>
                              )}
                              {audit.lowRisk > 0 && (
                                <Badge className="bg-green-500/20 text-green-500 border-green-500 text-xs">
                                  {audit.lowRisk}L
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {audit.autoBountyTriggered ? (
                                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500 text-xs">
                                  <Zap className="h-3 w-3 mr-1" />
                                  {audit.bountiesCreated} Created
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-500/20 text-gray-500 border-gray-500 text-xs">
                                  No Trigger
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{audit.date}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link href={`/owner/audits/${audit.id}`}>
                                <Button size="sm" variant="outline" className="text-xs bg-transparent">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </Link>
                              {audit.highRisk > 0 && !audit.autoBountyTriggered && (
                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Create Bounties
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <OwnerConfigPanel onParamsChange={handleParamsChange} />
            <AiAuditTrigger />
            {/* Add more owner-specific components here */}
          </div>
        </div>
      )}
    </div>
  )
}

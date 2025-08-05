"use client"

import { CardDescription } from "@/components/ui/card"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CodeViewer } from "@/components/code-viewer"
import { ScoreChart } from "@/components/score-chart"
import { VulnerabilityTable } from "@/components/vulnerability-table"
import type { AuditResult } from "@/types/audit"
import { getAuditResult } from "@/lib/audit-service"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Shield, Download, Eye, Plus, Clock, AlertTriangle } from "lucide-react"

interface Issue {
  id: string
  type: string
  severity: "High" | "Medium" | "Low"
  line: number
  description: string
  snippet: string
  selected: boolean
}

interface BountyPreview {
  issueId: string
  reward: number
  deadline: string
}

export default function OwnerAuditDetailsPage() {
  const params = useParams()
  const auditId = params.auditId as string
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])
  const [rewardPerIssue, setRewardPerIssue] = useState<Record<string, number>>({})
  const [deadline, setDeadline] = useState("")
  const [isEscrow, setIsEscrow] = useState(false)
  const [isCreatingBounties, setIsCreatingBounties] = useState(false)

  useEffect(() => {
    if (auditId) {
      const fetchAudit = async () => {
        try {
          setLoading(true)
          const result = await getAuditResult(auditId)
          setAuditResult(result)
        } catch (err) {
          console.error("Failed to fetch audit result:", err)
          setError("Failed to load audit results. Please try again.")
        } finally {
          setLoading(false)
        }
      }
      fetchAudit()
    } else {
      setLoading(false)
      setError("No audit ID provided.")
    }
  }, [auditId])

  const handleIssueSelection = (issueId: string, checked: boolean) => {
    if (checked) {
      setSelectedIssues([...selectedIssues, issueId])
      setRewardPerIssue({ ...rewardPerIssue, [issueId]: 0.1 })
    } else {
      setSelectedIssues(selectedIssues.filter((id) => id !== issueId))
      const newRewards = { ...rewardPerIssue }
      delete newRewards[issueId]
      setRewardPerIssue(newRewards)
    }
  }

  const handleRewardChange = (issueId: string, reward: number) => {
    setRewardPerIssue({ ...rewardPerIssue, [issueId]: reward })
  }

  const handleCreateBounties = async () => {
    if (selectedIssues.length === 0) {
      toast({
        title: "No issues selected",
        description: "Please select at least one issue to create bounties",
        variant: "destructive",
      })
      return
    }

    setIsCreatingBounties(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Bounties Created",
        description: `Successfully created ${selectedIssues.length} bounties`,
      })

      router.push("/owner/bounties")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create bounties",
        variant: "destructive",
      })
    } finally {
      setIsCreatingBounties(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "text-red-500"
      case "Medium":
        return "text-yellow-500"
      case "Low":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "High":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500">High</Badge>
      case "Medium":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">Medium</Badge>
      case "Low":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500">Low</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">Loading audit results...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-destructive">
        <p className="text-lg">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  if (!auditResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <p className="text-lg text-muted-foreground">No audit results found for this ID.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const { score, vulnerabilities, codeSnippet, recommendations } = auditResult

  const totalReward = Object.values(rewardPerIssue).reduce((sum, reward) => sum + reward, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">Audit Details (Owner View)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="card-cyber lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Overall Score</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ScoreChart score={score} />
          </CardContent>
        </Card>

        <Card className="card-cyber lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="card-cyber mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">Detected Vulnerabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <VulnerabilityTable vulnerabilities={vulnerabilities} />
        </CardContent>
      </Card>

      <Card className="card-cyber mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">Audited Code Snippet</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeViewer code={codeSnippet} language="solidity" />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Issues */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <Card className="border-gray-800/50 bg-gray-900/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-400" />
                Audit Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold">
                    <span
                      className={getSeverityColor(
                        auditResult.score >= 80 ? "High" : auditResult.score >= 50 ? "Medium" : "Low",
                      )}
                    >
                      {auditResult.score}
                    </span>
                    <span className="text-lg text-gray-400">/100</span>
                  </div>
                  <div className="text-sm text-gray-400">Security Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{auditResult.vulnerabilities.length}</div>
                  <div className="text-sm text-gray-400">Total Issues</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{auditResult.executionTime}</div>
                  <div className="text-sm text-gray-400">Execution Time</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Raw
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Issues Table */}
          <Card className="border-gray-800/50 bg-gray-900/20">
            <CardHeader>
              <CardTitle className="text-white">Identified Issues</CardTitle>
              <CardDescription>Select issues to create bounties for</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditResult.vulnerabilities.map((issue) => (
                  <div key={issue.id} className="border border-gray-800 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedIssues.includes(issue.id)}
                        onCheckedChange={(checked) => handleIssueSelection(issue.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSeverityBadge(issue.severity)}
                          <span className="font-medium text-white">{issue.type}</span>
                          <span className="text-sm text-gray-400">Line {issue.line}</span>
                        </div>
                        <p className="text-gray-300 mb-3">{issue.description}</p>
                        <div className="bg-gray-800 rounded p-3">
                          <pre className="text-sm text-gray-300 overflow-x-auto">{issue.snippet}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Bounty Creation */}
        <div className="space-y-6">
          <Card className="border-gray-800/50 bg-gray-900/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Plus className="h-5 w-5 mr-2 text-purple-400" />
                Create Bounties
              </CardTitle>
              <CardDescription>Configure bounties for selected issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedIssues.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select issues to configure bounties</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {selectedIssues.map((issueId) => {
                      const issue = auditResult.vulnerabilities.find((i) => i.id === issueId)
                      return (
                        <div key={issueId} className="border border-gray-700 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">{issue?.type}</span>
                            {issue && getSeverityBadge(issue.severity)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`reward-${issueId}`} className="text-xs text-gray-400">
                              Reward (ETH)
                            </Label>
                            <Input
                              id={`reward-${issueId}`}
                              type="number"
                              step="0.01"
                              value={rewardPerIssue[issueId] || 0}
                              onChange={(e) => handleRewardChange(issueId, Number.parseFloat(e.target.value) || 0)}
                              className="h-8 bg-gray-800 border-gray-700"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="deadline" className="text-sm text-gray-400">
                        Deadline
                      </Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="escrow" className="text-sm text-gray-400">
                        Escrow Payment
                      </Label>
                      <Switch id="escrow" checked={isEscrow} onCheckedChange={setIsEscrow} />
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-400">Total Reward</span>
                      <span className="text-lg font-bold text-white">{totalReward.toFixed(3)} ETH</span>
                    </div>
                    <Button
                      onClick={handleCreateBounties}
                      disabled={isCreatingBounties || selectedIssues.length === 0}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {isCreatingBounties ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Creating Bounties...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Submit Bounties
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bounty Preview */}
          {selectedIssues.length > 0 && (
            <Card className="border-gray-800/50 bg-gray-900/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Bounty Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedIssues.map((issueId) => {
                    const issue = auditResult.vulnerabilities.find((i) => i.id === issueId)
                    const reward = rewardPerIssue[issueId] || 0
                    return (
                      <div key={issueId} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">{issue?.type}</span>
                        <span className="text-white font-medium">{reward.toFixed(3)} ETH</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={() => router.back()} className="btn-cyber-primary">
          Back to Audits
        </Button>
      </div>
    </div>
  )
}

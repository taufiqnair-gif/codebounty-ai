"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { Brain, Zap, AlertTriangle, CheckCircle, Clock, TrendingUp, Play, Pause, RotateCcw } from "lucide-react"

interface AuditJob {
  id: string
  contractAddress: string
  status: "queued" | "running" | "completed" | "failed"
  progress: number
  score?: number
  vulnerabilities?: number
  startTime: string
  endTime?: string
}

export default function AIAuditDashboardPage() {
  const { address, isConnected } = useWallet()
  const { toast } = useToast()
  const [contractAddress, setContractAddress] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [auditJobs, setAuditJobs] = useState<AuditJob[]>([])
  const [aiWorkerStatus, setAiWorkerStatus] = useState<"online" | "offline" | "busy">("online")
  const [queueSize, setQueueSize] = useState(3)
  const [completedAudits, setCompletedAudits] = useState(127)
  const [averageScore, setAverageScore] = useState(78)

  useEffect(() => {
    if (isConnected) {
      fetchAuditJobs()
      // Simulate real-time updates
      const interval = setInterval(() => {
        updateJobProgress()
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

  const fetchAuditJobs = () => {
    // Mock data
    setAuditJobs([
      {
        id: "audit-1",
        contractAddress: "0x1234...5678",
        status: "running",
        progress: 65,
        startTime: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: "audit-2",
        contractAddress: "0xabcd...efgh",
        status: "completed",
        progress: 100,
        score: 85,
        vulnerabilities: 2,
        startTime: new Date(Date.now() - 600000).toISOString(),
        endTime: new Date(Date.now() - 60000).toISOString(),
      },
      {
        id: "audit-3",
        contractAddress: "0x9876...4321",
        status: "queued",
        progress: 0,
        startTime: new Date().toISOString(),
      },
    ])
  }

  const updateJobProgress = () => {
    setAuditJobs((prev) =>
      prev.map((job) => {
        if (job.status === "running" && job.progress < 100) {
          const newProgress = Math.min(job.progress + Math.random() * 10, 100)
          if (newProgress >= 100) {
            return {
              ...job,
              status: "completed" as const,
              progress: 100,
              score: Math.floor(Math.random() * 40) + 60,
              vulnerabilities: Math.floor(Math.random() * 5),
              endTime: new Date().toISOString(),
            }
          }
          return { ...job, progress: newProgress }
        }
        return job
      }),
    )
  }

  const handleSubmitAudit = async () => {
    if (!contractAddress || !isConnected) {
      toast({
        title: "Error",
        description: "Please enter contract address and connect wallet",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Mock audit submission
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newJob: AuditJob = {
        id: `audit-${Date.now()}`,
        contractAddress,
        status: "queued",
        progress: 0,
        startTime: new Date().toISOString(),
      }

      setAuditJobs((prev) => [newJob, ...prev])
      setQueueSize((prev) => prev + 1)

      toast({
        title: "Audit Submitted",
        description: "Your contract has been queued for AI audit",
      })
      setContractAddress("")
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queued":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "running":
        return <Zap className="h-4 w-4 text-blue-500 animate-pulse" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "queued":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Queued</Badge>
      case "running":
        return <Badge className="bg-blue-500/20 text-blue-400">Running</Badge>
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <Brain className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground text-center">Please connect your wallet to access the AI audit dashboard</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <Brain className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">AI Audit Dashboard</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Worker Status</CardTitle>
            <div
              className={`h-3 w-3 rounded-full ${
                aiWorkerStatus === "online"
                  ? "bg-green-500"
                  : aiWorkerStatus === "busy"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize text-cyber-glow">{aiWorkerStatus}</div>
            <p className="text-xs text-muted-foreground">Processing capacity available</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{queueSize}</div>
            <p className="text-xs text-muted-foreground">Audits waiting</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Audits</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{completedAudits}</div>
            <p className="text-xs text-muted-foreground">Total processed</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{averageScore}/100</div>
            <p className="text-xs text-muted-foreground">Security rating</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit New Audit */}
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle>Submit New Audit</CardTitle>
            <CardDescription>Queue a smart contract for AI security analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contract-address">Contract Address</Label>
              <Input
                id="contract-address"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="input-cyber"
              />
            </div>
            <Button
              onClick={handleSubmitAudit}
              disabled={isSubmitting || !contractAddress}
              className="w-full btn-cyber-primary"
            >
              {isSubmitting ? "Submitting..." : "Submit for Audit"}
            </Button>
          </CardContent>
        </Card>

        {/* AI Worker Controls */}
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle>AI Worker Controls</CardTitle>
            <CardDescription>Manage the AI audit engine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Worker Status</span>
              <Badge
                className={
                  aiWorkerStatus === "online"
                    ? "bg-green-500/20 text-green-400"
                    : aiWorkerStatus === "busy"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                }
              >
                {aiWorkerStatus}
              </Badge>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="flex-1 btn-cyber-primary" onClick={() => setAiWorkerStatus("online")}>
                <Play className="h-4 w-4 mr-1" /> Start
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setAiWorkerStatus("offline")}
              >
                <Pause className="h-4 w-4 mr-1" /> Pause
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAuditJobs([])
                  setQueueSize(0)
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>AI audit engine performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Speed</span>
                <span className="text-cyber-glow">2.3 contracts/min</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Accuracy Rate</span>
                <span className="text-green-400">94.7%</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uptime</span>
                <span className="text-blue-400">99.2%</span>
              </div>
              <Progress value={99} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Jobs List */}
      <Card className="card-cyber mt-6">
        <CardHeader>
          <CardTitle>Recent Audit Jobs</CardTitle>
          <CardDescription>Track your submitted audits and their progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditJobs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No audit jobs yet</p>
            ) : (
              auditJobs.map((job) => (
                <div key={job.id} className="border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="font-medium">{job.contractAddress}</p>
                        <p className="text-sm text-muted-foreground">
                          Started: {new Date(job.startTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>

                  {job.status === "running" && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{Math.round(job.progress)}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  )}

                  {job.status === "completed" && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Security Score: </span>
                        <span className="font-medium text-cyber-glow">{job.score}/100</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vulnerabilities: </span>
                        <span className="font-medium text-red-400">{job.vulnerabilities}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

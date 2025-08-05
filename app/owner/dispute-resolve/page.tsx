"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { Scale, AlertTriangle, CheckCircle, Clock, MessageSquare, FileText, ExternalLink } from "lucide-react"

interface Dispute {
  id: string
  bountyId: string
  bountyTitle: string
  hunterAddress: string
  ownerAddress: string
  type: "quality" | "payment" | "scope" | "timeline"
  status: "open" | "under_review" | "resolved" | "escalated"
  description: string
  hunterEvidence: string
  ownerResponse?: string
  resolution?: string
  createdAt: string
  updatedAt: string
  amount: string
}

export default function DisputeResolvePage() {
  const { address, isConnected } = useWallet()
  const { toast } = useToast()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [response, setResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isConnected) {
      fetchDisputes()
    }
  }, [isConnected])

  const fetchDisputes = () => {
    // Mock data
    setDisputes([
      {
        id: "dispute-1",
        bountyId: "bounty-123",
        bountyTitle: "DeFi Protocol Security Fix",
        hunterAddress: "0xhunter123...456",
        ownerAddress: address || "0xowner789...012",
        type: "quality",
        status: "open",
        description:
          "The submitted fix doesn't address the core reentrancy issue properly. The solution only adds a basic check but doesn't implement the full CEI pattern.",
        hunterEvidence:
          "I have implemented the ReentrancyGuard from OpenZeppelin and added proper state updates before external calls. The fix follows industry best practices.",
        amount: "500 BTY",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "dispute-2",
        bountyId: "bounty-456",
        bountyTitle: "NFT Marketplace Audit",
        hunterAddress: "0xhunter789...123",
        ownerAddress: address || "0xowner456...789",
        type: "payment",
        status: "under_review",
        description: "Payment was not released after successful audit completion and approval.",
        hunterEvidence:
          "Audit was completed on time with 3 critical vulnerabilities found and fixed. Owner approved the submission but payment is still pending.",
        ownerResponse:
          "We need additional verification of the fixes before releasing payment. The vulnerabilities were complex and require thorough testing.",
        amount: "1000 BTY",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: "dispute-3",
        bountyId: "bounty-789",
        bountyTitle: "Token Bridge Security",
        hunterAddress: "0xhunter456...789",
        ownerAddress: address || "0xowner123...456",
        type: "scope",
        status: "resolved",
        description: "Scope was changed after submission without prior agreement.",
        hunterEvidence:
          "Original bounty specified frontend vulnerabilities only, but owner later requested smart contract audit as well.",
        ownerResponse:
          "The scope was clarified based on the initial findings. We provided additional compensation for the expanded scope.",
        resolution:
          "Dispute resolved with additional 200 BTY compensation for expanded scope. Both parties agreed to the resolution.",
        amount: "750 BTY",
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 21600000).toISOString(),
      },
    ])
  }

  const handleRespond = async (disputeId: string) => {
    if (!response.trim()) {
      toast({
        title: "Error",
        description: "Please enter a response",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Mock response submission
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setDisputes((prev) =>
        prev.map((dispute) =>
          dispute.id === disputeId
            ? {
                ...dispute,
                ownerResponse: response,
                status: "under_review" as const,
                updatedAt: new Date().toISOString(),
              }
            : dispute,
        ),
      )

      toast({
        title: "Response Submitted",
        description: "Your response has been recorded",
      })
      setResponse("")
      setSelectedDispute(null)
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

  const handleResolve = async (disputeId: string, resolution: "approve" | "reject") => {
    setIsSubmitting(true)
    try {
      // Mock resolution
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const resolutionText =
        resolution === "approve"
          ? "Dispute resolved in favor of hunter. Payment released."
          : "Dispute resolved in favor of owner. No additional payment required."

      setDisputes((prev) =>
        prev.map((dispute) =>
          dispute.id === disputeId
            ? {
                ...dispute,
                status: "resolved" as const,
                resolution: resolutionText,
                updatedAt: new Date().toISOString(),
              }
            : dispute,
        ),
      )

      toast({
        title: "Dispute Resolved",
        description: resolutionText,
      })
    } catch (error) {
      toast({
        title: "Resolution Failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-red-500/20 text-red-400">Open</Badge>
      case "under_review":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Under Review</Badge>
      case "resolved":
        return <Badge className="bg-green-500/20 text-green-400">Resolved</Badge>
      case "escalated":
        return <Badge className="bg-purple-500/20 text-purple-400">Escalated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "quality":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "payment":
        return <FileText className="h-4 w-4 text-green-500" />
      case "scope":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "timeline":
        return <Clock className="h-4 w-4 text-purple-500" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <Scale className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground text-center">Please connect your wallet to access dispute resolution</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <Scale className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Dispute Resolution</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{disputes.filter((d) => d.status === "open").length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {disputes.filter((d) => d.status === "under_review").length}
            </div>
            <p className="text-xs text-muted-foreground">Being processed</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {disputes.filter((d) => d.status === "resolved").length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully closed</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyber-glow">87%</div>
            <p className="text-xs text-muted-foreground">Average success rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Disputes</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="space-y-4">
            {disputes
              .filter((d) => d.status !== "resolved")
              .map((dispute) => (
                <Card key={dispute.id} className="card-cyber">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(dispute.type)}
                        <div>
                          <CardTitle className="text-lg">{dispute.bountyTitle}</CardTitle>
                          <CardDescription>
                            Dispute #{dispute.id} • {dispute.type.charAt(0).toUpperCase() + dispute.type.slice(1)} Issue
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(dispute.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Hunter: </span>
                        <span className="font-mono">{dispute.hunterAddress}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount: </span>
                        <span className="font-bold text-cyber-glow">{dispute.amount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created: </span>
                        <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Updated: </span>
                        <span>{new Date(dispute.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Hunter's Claim:</h4>
                        <p className="text-sm text-muted-foreground bg-gray-800/50 p-3 rounded">
                          {dispute.description}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Hunter's Evidence:</h4>
                        <p className="text-sm text-muted-foreground bg-gray-800/50 p-3 rounded">
                          {dispute.hunterEvidence}
                        </p>
                      </div>

                      {dispute.ownerResponse && (
                        <div>
                          <h4 className="font-medium mb-2">Your Response:</h4>
                          <p className="text-sm text-muted-foreground bg-blue-900/20 p-3 rounded">
                            {dispute.ownerResponse}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {dispute.status === "open" && !dispute.ownerResponse && (
                        <Button onClick={() => setSelectedDispute(dispute)} className="btn-cyber-primary">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Respond
                        </Button>
                      )}

                      {dispute.status === "under_review" && (
                        <>
                          <Button
                            onClick={() => handleResolve(dispute.id, "approve")}
                            disabled={isSubmitting}
                            className="btn-cyber-primary"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Hunter
                          </Button>
                          <Button
                            onClick={() => handleResolve(dispute.id, "reject")}
                            disabled={isSubmitting}
                            variant="outline"
                            className="btn-cyber-secondary"
                          >
                            Reject Claim
                          </Button>
                        </>
                      )}

                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Bounty
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="resolved">
          <div className="space-y-4">
            {disputes
              .filter((d) => d.status === "resolved")
              .map((dispute) => (
                <Card key={dispute.id} className="card-cyber">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <CardTitle className="text-lg">{dispute.bountyTitle}</CardTitle>
                          <CardDescription>
                            Resolved on {new Date(dispute.updatedAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(dispute.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dispute.resolution && (
                      <div className="bg-green-900/20 p-3 rounded">
                        <h4 className="font-medium text-green-400 mb-2">Resolution:</h4>
                        <p className="text-sm">{dispute.resolution}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <Card key={dispute.id} className="card-cyber">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(dispute.type)}
                      <div>
                        <CardTitle className="text-lg">{dispute.bountyTitle}</CardTitle>
                        <CardDescription>
                          {dispute.type.charAt(0).toUpperCase() + dispute.type.slice(1)} • {dispute.amount}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(dispute.status)}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Response Modal */}
      {selectedDispute && (
        <Card className="fixed inset-4 z-50 bg-background border-2 border-primary/50 max-w-2xl mx-auto my-auto h-fit">
          <CardHeader>
            <CardTitle>Respond to Dispute</CardTitle>
            <CardDescription>Provide your response to the hunter's claim</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Hunter's Claim:</h4>
              <p className="text-sm text-muted-foreground bg-gray-800/50 p-3 rounded">{selectedDispute.description}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your Response:</label>
              <Textarea
                placeholder="Explain your position and provide any relevant evidence..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="min-h-[120px] bg-gray-800 border-gray-700"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => handleRespond(selectedDispute.id)}
                disabled={isSubmitting || !response.trim()}
                className="btn-cyber-primary"
              >
                {isSubmitting ? "Submitting..." : "Submit Response"}
              </Button>
              <Button
                onClick={() => {
                  setSelectedDispute(null)
                  setResponse("")
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

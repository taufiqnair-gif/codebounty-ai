"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Gavel, Flag, Loader2, Info } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { ContractService } from "@/lib/contract-service"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Dispute {
  id: string
  bountyId: string
  submissionId?: string
  raisedBy: string
  reason: string
  status: "Open" | "Resolved" | "Escalated" | "Appealed"
  resolution?: string
  resolvedBy?: string
}

export default function DisputeAppealPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newDisputeBountyId, setNewDisputeBountyId] = useState("")
  const [newDisputeSubmissionId, setNewDisputeSubmissionId] = useState("")
  const [newDisputeReason, setNewDisputeReason] = useState("")
  const [isRaisingDispute, setIsRaisingDispute] = useState(false)
  const [selectedDisputeToAppeal, setSelectedDisputeToAppeal] = useState<Dispute | null>(null)
  const [appealReason, setAppealReason] = useState("")
  const [isAppealing, setIsAppealing] = useState(false)

  const { toast } = useToast()
  const { isConnected, address, provider, signer } = useWallet()

  useEffect(() => {
    const fetchDisputes = async () => {
      if (!isConnected || !address || !provider) {
        setLoading(false)
        setError("Please connect your wallet to view disputes.")
        return
      }
      setLoading(true)
      setError(null)
      try {
        // Mock fetching disputes for the current user
        const mockDisputes: Dispute[] = [
          {
            id: "dispute-001",
            bountyId: "bounty-123",
            submissionId: "submission-abc",
            raisedBy: "0xOwner123...",
            reason: "Hunter submitted low-quality fix, did not address all vulnerabilities.",
            status: "Open",
          },
          {
            id: "dispute-004",
            bountyId: "bounty-999",
            submissionId: "submission-xyz",
            raisedBy: address, // This dispute is raised by the current hunter
            reason: "Owner rejected my valid submission without clear reason.",
            status: "Resolved",
            resolution: "Owner decided to reject the submission due to minor bug.",
            resolvedBy: "0xOwner123...",
          },
          {
            id: "dispute-005",
            bountyId: "bounty-888",
            submissionId: "submission-pqr",
            raisedBy: "0xAnotherHunter...",
            reason: "Another hunter copied my solution.",
            status: "Open",
          },
        ]
        setDisputes(
          mockDisputes.filter(
            (d) =>
              d.raisedBy.toLowerCase() === address.toLowerCase() ||
              d.submissionId?.includes(address.slice(2, 6).toLowerCase()),
          ),
        ) // Simplified filter
      } catch (err) {
        console.error("Failed to fetch disputes:", err)
        setError("Failed to load disputes. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchDisputes()
  }, [isConnected, address, provider])

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDisputeBountyId || !newDisputeReason || !isConnected || !signer) {
      toast({
        title: "Missing Information or Wallet Not Connected",
        description: "Please fill all fields and connect your wallet.",
        variant: "destructive",
      })
      return
    }

    setIsRaisingDispute(true)
    try {
      const contractService = new ContractService(provider!, signer!)
      // In a real scenario, this would call a dispute module contract
      console.log(`Raising dispute for bounty ${newDisputeBountyId}: ${newDisputeReason}`)
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate blockchain tx

      const newDispute: Dispute = {
        id: `dispute-${Date.now()}`,
        bountyId: newDisputeBountyId,
        submissionId: newDisputeSubmissionId || undefined,
        raisedBy: signer.address,
        reason: newDisputeReason,
        status: "Open",
      }
      setDisputes((prev) => [newDispute, ...prev])
      toast({
        title: "Dispute Raised",
        description: "Your dispute has been successfully submitted for review.",
      })
      setNewDisputeBountyId("")
      setNewDisputeSubmissionId("")
      setNewDisputeReason("")
    } catch (error) {
      console.error("Failed to raise dispute:", error)
      toast({
        title: "Error",
        description: "Failed to raise dispute. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRaisingDispute(false)
    }
  }

  const handleAppealDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDisputeToAppeal || !appealReason || !isConnected || !signer) {
      toast({
        title: "Missing Information or Wallet Not Connected",
        description: "Please provide an appeal reason and connect your wallet.",
        variant: "destructive",
      })
      return
    }

    setIsAppealing(true)
    try {
      const contractService = new ContractService(provider!, signer!)
      // In a real scenario, this would call a dispute module contract's appeal method
      console.log(`Appealing dispute ${selectedDisputeToAppeal.id}: ${appealReason}`)
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate blockchain tx

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === selectedDisputeToAppeal.id
            ? {
                ...d,
                status: "Appealed",
                resolution: (d.resolution || "") + `\nAppeal: ${appealReason}`,
              }
            : d,
        ),
      )
      toast({
        title: "Appeal Submitted",
        description: `Your appeal for dispute ${selectedDisputeToAppeal.id} has been submitted.`,
      })
      setSelectedDisputeToAppeal(null)
      setAppealReason("")
    } catch (error) {
      console.error("Failed to appeal dispute:", error)
      toast({
        title: "Error",
        description: "Failed to appeal dispute. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAppealing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">Loading disputes...</span>
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

  const myOpenDisputes = disputes.filter((d) => d.status === "Open")
  const myResolvedDisputes = disputes.filter((d) => d.status !== "Open")

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">Dispute & Appeal</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto mb-10">
        Raise a dispute if you believe an audit result or bounty resolution is unfair, or appeal a previous decision.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <Flag className="h-5 w-5" /> Raise New Dispute
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Submit a new dispute regarding a bounty or audit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRaiseDispute} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bounty-id" className="text-muted-foreground">
                  Bounty ID (e.g., bounty-123)
                </Label>
                <Input
                  id="bounty-id"
                  type="text"
                  placeholder="Enter the ID of the bounty in dispute"
                  value={newDisputeBountyId}
                  onChange={(e) => setNewDisputeBountyId(e.target.value)}
                  className="input-cyber"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="submission-id" className="text-muted-foreground">
                  Submission ID (Optional, if related to a specific submission)
                </Label>
                <Input
                  id="submission-id"
                  type="text"
                  placeholder="Enter the ID of the submission in dispute"
                  value={newDisputeSubmissionId}
                  onChange={(e) => setNewDisputeSubmissionId(e.target.value)}
                  className="input-cyber"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dispute-reason" className="text-muted-foreground">
                  Reason for Dispute
                </Label>
                <Textarea
                  id="dispute-reason"
                  placeholder="Explain why you are raising this dispute (e.g., unfair rejection, incorrect audit result)."
                  value={newDisputeReason}
                  onChange={(e) => setNewDisputeReason(e.target.value)}
                  className="min-h-[100px] bg-gray-800 border-gray-700"
                  required
                />
              </div>
              <Button type="submit" disabled={isRaisingDispute || !isConnected} className="btn-cyber-primary w-full">
                {isRaisingDispute ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Raising Dispute...
                  </>
                ) : (
                  "Raise Dispute"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <Gavel className="h-5 w-5" /> Your Disputes & Appeals
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Track the status of disputes you have raised or are involved in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {disputes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No disputes found for your wallet.</div>
            ) : (
              disputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="p-4 border border-gray-700 rounded-md bg-gray-900/30 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-white">Dispute ID: {dispute.id}</h3>
                    <Badge
                      className={cn(
                        dispute.status === "Open" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                        dispute.status === "Resolved" && "bg-green-500/20 text-green-400 border-green-500/30",
                        dispute.status === "Appealed" && "bg-purple-500/20 text-purple-400 border-purple-500/30",
                        dispute.status === "Escalated" && "bg-red-500/20 text-red-400 border-red-500/30",
                      )}
                    >
                      {dispute.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    **Bounty ID:** {dispute.bountyId}{" "}
                    {dispute.submissionId && `| **Submission ID:** ${dispute.submissionId}`}
                  </p>
                  <p className="text-sm text-white mt-2">
                    **Reason:** <span className="text-muted-foreground">{dispute.reason}</span>
                  </p>
                  {dispute.resolution && (
                    <p className="text-sm text-white mt-1">
                      **Resolution:** <span className="text-muted-foreground">{dispute.resolution}</span>
                    </p>
                  )}
                  {dispute.status === "Resolved" && (
                    <Button
                      variant="outline"
                      className="btn-cyber-secondary mt-3 w-full bg-transparent"
                      onClick={() => setSelectedDisputeToAppeal(dispute)}
                    >
                      Appeal Decision
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {selectedDisputeToAppeal && (
        <Card className="card-cyber mt-8 max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <Info className="h-5 w-5" /> Appeal Dispute: {selectedDisputeToAppeal.id}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Provide your reasons for appealing this dispute's resolution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-md bg-gray-800/50 border border-gray-700">
              <p className="text-sm text-muted-foreground">
                **Original Reason:** <span className="text-white">{selectedDisputeToAppeal.reason}</span>
              </p>
              {selectedDisputeToAppeal.resolution && (
                <p className="text-sm text-muted-foreground mt-2">
                  **Original Resolution:** <span className="text-white">{selectedDisputeToAppeal.resolution}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="appeal-reason" className="text-muted-foreground">
                Reason for Appeal
              </Label>
              <Textarea
                id="appeal-reason"
                placeholder="Explain why you believe the previous resolution was incorrect or unfair, and provide new evidence if applicable."
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                className="min-h-[100px] bg-gray-800 border-gray-700"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                className="btn-cyber-secondary bg-transparent"
                onClick={() => setSelectedDisputeToAppeal(null)}
                disabled={isAppealing}
              >
                Cancel
              </Button>
              <Button
                className="btn-cyber-primary"
                onClick={handleAppealDispute}
                disabled={isAppealing || !appealReason}
              >
                {isAppealing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Appeal...
                  </>
                ) : (
                  "Submit Appeal"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

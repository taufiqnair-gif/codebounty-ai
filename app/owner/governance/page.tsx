"use client"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Gavel, PlusCircle, Loader2, Settings } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { ContractService } from "@/lib/contract-service"

interface Proposal {
  id: string
  title: string
  description: string
  proposer: string
  status: "Pending" | "Active" | "Executed" | "Defeated"
  votesFor: number
  votesAgainst: number
  eta: string
}

export default function GovernancePage() {
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: "prop-001",
      title: "Upgrade AuditEngine to v2.0",
      description: "Proposes an upgrade to the AuditEngine contract to incorporate new AI models and features.",
      proposer: "0xOwnerDAO...",
      status: "Active",
      votesFor: 150,
      votesAgainst: 20,
      eta: "2 days",
    },
    {
      id: "prop-002",
      title: "Adjust Bounty Fee to 2%",
      description: "Proposes reducing the platform fee on bounties from 5% to 2% to incentivize more participation.",
      proposer: "0xCommunity...",
      status: "Pending",
      votesFor: 0,
      votesAgainst: 0,
      eta: "5 days",
    },
    {
      id: "prop-003",
      title: "Implement new dispute resolution mechanism",
      description: "Proposes a new on-chain dispute resolution module with juror selection.",
      proposer: "0xCoreTeam...",
      status: "Executed",
      votesFor: 300,
      votesAgainst: 10,
      eta: "N/A",
    },
  ])
  const [newProposalTitle, setNewProposalTitle] = useState("")
  const [newProposalDescription, setNewProposalDescription] = useState("")
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false)
  const { toast } = useToast()
  const { isConnected, signer, provider } = useWallet()

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProposalTitle || !newProposalDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and description for the proposal.",
        variant: "destructive",
      })
      return
    }
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to submit a proposal.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingProposal(true)
    try {
      const contractService = new ContractService(provider!, signer!)
      // In a real scenario, this would call a governance contract method like proposeUpgrade
      console.log(`Proposing: ${newProposalTitle} - ${newProposalDescription}`)
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate blockchain tx

      const newProposal: Proposal = {
        id: `prop-${Date.now()}`,
        title: newProposalTitle,
        description: newProposalDescription,
        proposer: signer.address,
        status: "Pending",
        votesFor: 0,
        votesAgainst: 0,
        eta: "7 days", // Default ETA
      }
      setProposals((prev) => [newProposal, ...prev])
      toast({
        title: "Proposal Submitted",
        description: "Your governance proposal has been submitted successfully!",
      })
      setNewProposalTitle("")
      setNewProposalDescription("")
    } catch (error) {
      console.error("Failed to submit proposal:", error)
      toast({
        title: "Error",
        description: "Failed to submit proposal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingProposal(false)
    }
  }

  const handleVote = async (proposalId: string, voteType: "for" | "against") => {
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to vote.",
        variant: "destructive",
      })
      return
    }

    try {
      const contractService = new ContractService(provider!, signer!)
      // In a real scenario, this would call a governance contract method like vote
      console.log(`Voting ${voteType} on proposal ${proposalId}`)
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate blockchain tx

      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId
            ? {
                ...p,
                votesFor: voteType === "for" ? p.votesFor + 1 : p.votesFor,
                votesAgainst: voteType === "against" ? p.votesAgainst + 1 : p.votesAgainst,
              }
            : p,
        ),
      )
      toast({
        title: "Vote Cast",
        description: `Your vote for proposal ${proposalId} has been recorded.`,
      })
    } catch (error) {
      console.error("Failed to cast vote:", error)
      toast({
        title: "Error",
        description: "Failed to cast vote. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">Protocol Governance</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto mb-10">
        Participate in the decentralized governance of CodeBountyAI. Propose and vote on upgrades, parameter changes,
        and new features.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Submit New Proposal
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Create a new proposal for the community to vote on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePropose} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proposal-title" className="text-muted-foreground">
                  Proposal Title
                </Label>
                <Input
                  id="proposal-title"
                  type="text"
                  placeholder="e.g., Implement new tokenomics model"
                  value={newProposalTitle}
                  onChange={(e) => setNewProposalTitle(e.target.value)}
                  className="input-cyber"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proposal-description" className="text-muted-foreground">
                  Proposal Description
                </Label>
                <Textarea
                  id="proposal-description"
                  placeholder="Provide detailed explanation and rationale for your proposal."
                  value={newProposalDescription}
                  onChange={(e) => setNewProposalDescription(e.target.value)}
                  className="min-h-[100px] bg-gray-800 border-gray-700"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmittingProposal || !isConnected}
                className="btn-cyber-primary w-full"
              >
                {isSubmittingProposal ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Proposal"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <Gavel className="h-5 w-5" /> Active Proposals
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Proposals currently open for voting by the community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {proposals.filter((p) => p.status === "Active").length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No active proposals at the moment.</div>
            ) : (
              proposals
                .filter((p) => p.status === "Active")
                .map((proposal) => (
                  <div
                    key={proposal.id}
                    className="p-4 border border-gray-700 rounded-md bg-gray-900/30 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-white">{proposal.title}</h3>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Proposer: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)} | ETA: {proposal.eta}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-medium">{proposal.votesFor} FOR</span>
                        <span className="text-red-400 font-medium">{proposal.votesAgainst} AGAINST</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleVote(proposal.id, "for")}
                          disabled={!isConnected}
                        >
                          Vote FOR
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleVote(proposal.id, "against")}
                          disabled={!isConnected}
                        >
                          Vote AGAINST
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="card-cyber mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <Settings className="h-5 w-5" /> Past Proposals
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Review proposals that have been executed or defeated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {proposals.filter((p) => p.status !== "Active").length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No past proposals.</div>
          ) : (
            proposals
              .filter((p) => p.status !== "Active")
              .map((proposal) => (
                <div
                  key={proposal.id}
                  className="p-4 border border-gray-700 rounded-md bg-gray-900/30 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-white">{proposal.title}</h3>
                    <Badge
                      className={cn(
                        proposal.status === "Executed" && "bg-purple-500/20 text-purple-400 border-purple-500/30",
                        proposal.status === "Defeated" && "bg-gray-500/20 text-gray-400 border-gray-500/30",
                        proposal.status === "Pending" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                      )}
                    >
                      {proposal.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Proposer: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-green-400 font-medium">{proposal.votesFor} FOR</span>
                    <span className="text-red-400 font-medium">{proposal.votesAgainst} AGAINST</span>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

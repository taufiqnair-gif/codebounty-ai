"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, CheckCircle, Clock, FileText, DollarSign, Calendar, Target } from "lucide-react"
import { getBounties, submitBounty } from "@/lib/bounty-service" // Corrected import
import type { Bounty } from "@/types/bounty"
import { useWallet } from "@/hooks/use-wallet"
import { Textarea } from "@/components/ui/textarea"
import { CodeEditor } from "@/components/code-editor"
import { Loader2 } from "lucide-react"
import { BountyStatus } from "@/types/bounty"

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)
  const [fixCode, setFixCode] = useState("")
  const [fixDescription, setFixDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { address, isConnected } = useWallet()
  const router = useRouter()

  useEffect(() => {
    const fetchBounties = async () => {
      setLoading(true)
      setError(null)
      try {
        const fetchedBounties = await getBounties(BountyStatus.Open) // Only show open bounties to hunters
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

  const handleSubmitFix = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBounty || !fixCode || !fixDescription || !isConnected || !address) return

    setIsSubmitting(true)
    try {
      await submitBounty(selectedBounty.id, {
        hunterAddress: address,
        description: fixDescription,
        auditReportLink: "N/A", // Placeholder, as code is directly submitted
      })
      toast({
        title: "Fix Submitted",
        description: "Your fix has been successfully submitted",
      })
      // Refresh bounties
      const updatedBounties = await getBounties(BountyStatus.Open)
      setBounties(updatedBounties)
      setSelectedBounty(null)
      setFixCode("")
      setFixDescription("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit fix",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500">Open</Badge>
      case "Pending": // Assuming "In Progress" for submissions is "Pending"
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500">In Review</Badge>
      case "Approved": // Assuming "Completed" for submissions is "Approved"
        return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500">Approved</Badge>
      case "Rejected":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500">Rejected</Badge>
      case "Closed":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Filter bounties for "My Submissions" tab
  const mySubmissions = bounties.filter((bounty) =>
    bounty.submissions.some((sub) => address && sub.hunterAddress.toLowerCase() === address.toLowerCase()),
  )

  // Filter bounties for "Completed" tab (where a submission has been approved)
  const completedBounties = bounties.filter((bounty) => bounty.submissions.some((sub) => sub.status === "Approved"))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">Loading bounties...</span>
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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black">
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm mb-6">
            <Target className="mr-2 h-4 w-4 text-purple-400" />
            <span className="text-purple-300">Security Bounty Marketplace</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Bounty Board
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover and claim security bounties. Help secure smart contracts and earn rewards.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-800/50 bg-gray-900/20">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {/* Sum rewards, assuming reward is a string like "1000 USDC" or "5 ETH" */}
                {bounties
                  .reduce((sum, b) => {
                    const match = b.reward.match(/(\d+(\.\d+)?)\s*(ETH|USDC|DAI|BOUNTY)/)
                    if (match) {
                      return sum + Number.parseFloat(match[1])
                    }
                    return sum
                  }, 0)
                  .toFixed(2)}{" "}
                Total
              </div>
              <div className="text-sm text-gray-400">Total Rewards</div>
            </CardContent>
          </Card>

          <Card className="border-gray-800/50 bg-gray-900/20">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {bounties.filter((b) => b.status === BountyStatus.Open).length}
              </div>
              <div className="text-sm text-gray-400">Open Bounties</div>
            </CardContent>
          </Card>

          <Card className="border-gray-800/50 bg-gray-900/20">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{completedBounties.length}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </CardContent>
          </Card>

          <Card className="border-gray-800/50 bg-gray-900/20">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">24h</div>
              <div className="text-sm text-gray-400">Avg Response</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="open" className="mb-8">
          <TabsList className="bg-gray-800/50">
            <TabsTrigger value="open">Open Bounties</TabsTrigger>
            <TabsTrigger value="my">My Submissions</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6">
            {bounties.filter((b) => b.status === BountyStatus.Open).length === 0 ? (
              <div className="text-center py-16">
                <Target className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Open Bounties</h3>
                <p className="text-gray-400">Check back later for new security bounties</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bounties
                  .filter((b) => b.status === BountyStatus.Open)
                  .map((bounty) => (
                    <Card
                      key={bounty.id}
                      className="border-gray-800/50 bg-gray-900/20 hover:border-purple-500/50 transition-colors"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <CardTitle className="text-lg font-medium text-white truncate">{bounty.title}</CardTitle>
                          {getStatusBadge(bounty.status)}
                        </div>
                        <CardDescription className="text-gray-400 line-clamp-2">{bounty.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Reward</span>
                            <div className="text-xl font-bold text-green-400">{bounty.reward}</div>
                          </div>

                          {/* Removed highSeverity and mediumSeverity as they are not part of Bounty type */}
                          {/* You might want to fetch audit details for this bounty to display vulnerability counts */}

                          <div className="pt-2 border-t border-gray-800">
                            <div className="flex items-center text-xs text-gray-400">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>Due: {new Date(bounty.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-3">
                        <Button
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          disabled={!isConnected}
                          onClick={() => setSelectedBounty(bounty)}
                        >
                          {!isConnected ? "Connect Wallet" : "View Details & Submit"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my" className="mt-6">
            {!isConnected ? (
              <div className="text-center py-16">
                <AlertTriangle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                <p className="text-gray-400">Connect your wallet to view your submissions</p>
              </div>
            ) : mySubmissions.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Submissions Yet</h3>
                <p className="text-gray-400">
                  You haven't submitted any fixes yet. Browse open bounties to get started!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mySubmissions.map((bounty) =>
                  // Display each submission for the bounty
                  bounty.submissions
                    .filter((sub) => address && sub.hunterAddress.toLowerCase() === address.toLowerCase())
                    .map((submission) => (
                      <Card key={submission.id} className="border-gray-800/50 bg-gray-900/20">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-medium text-white">{bounty.title}</CardTitle>
                            {getStatusBadge(submission.status)}
                          </div>
                          <CardDescription className="text-gray-400">{submission.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">Reward</span>
                              <div className="font-bold text-green-400">{bounty.reward}</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">Submission Date</span>
                              <div className="text-sm text-gray-300">
                                {new Date(submission.submissionDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          {submission.status === "Approved" ? (
                            <div className="w-full flex items-center justify-center p-3 bg-purple-500/20 rounded-md">
                              <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
                              <span className="text-purple-500 font-medium">Reward Claimed</span>
                            </div>
                          ) : (
                            <div className="w-full flex items-center justify-center p-3 bg-blue-500/20 rounded-md">
                              <Clock className="h-4 w-4 text-blue-500 mr-2" />
                              <span className="text-blue-500 font-medium">Under Review</span>
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    )),
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedBounties.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Completed Bounties</h3>
                <p className="text-gray-400">Completed bounties will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedBounties.map((bounty) =>
                  // Display each approved submission for the bounty
                  bounty.submissions
                    .filter((sub) => sub.status === "Approved")
                    .map((submission) => (
                      <Card key={submission.id} className="border-gray-800/50 bg-gray-900/20">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-medium text-white">{bounty.title}</CardTitle>
                            {getStatusBadge(submission.status)}
                          </div>
                          <CardDescription className="text-gray-400">{submission.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">Reward</span>
                              <div className="font-bold text-green-400">{bounty.reward}</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">Completed By</span>
                              <div className="font-mono text-sm text-gray-300 truncate max-w-[120px]">
                                {submission.hunterAddress}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full bg-transparent btn-cyber-secondary">
                            <FileText className="h-4 w-4 mr-2" />
                            View Solution
                          </Button>
                        </CardFooter>
                      </Card>
                    )),
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Submit Fix Modal/Form */}
        {selectedBounty && (
          <Card className="mb-8 border-purple-500/50 bg-gray-900/40">
            <CardHeader>
              <CardTitle className="text-white">Submit Fix for {selectedBounty.title}</CardTitle>
              <CardDescription>Provide your solution to fix the identified vulnerabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitFix} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Vulnerability Details</h3>
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-500">Identified Issues</h4>
                        <ul className="mt-2 space-y-1 text-sm text-gray-300">
                          {/* This part would ideally fetch the actual vulnerabilities from the audit associated with the bounty */}
                          {/* For now, showing a generic message or placeholder */}
                          <li>
                            <span className="font-medium">Refer to bounty description for details.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="fix-description" className="text-lg font-medium text-white">
                    Fix Description
                  </label>
                  <Textarea
                    id="fix-description"
                    placeholder="Explain your approach to fixing the vulnerabilities..."
                    value={fixDescription}
                    onChange={(e) => setFixDescription(e.target.value)}
                    className="min-h-[100px] bg-gray-800 border-gray-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="fix-code" className="text-lg font-medium text-white">
                    Fixed Code
                  </label>
                  <div className="h-[400px] border border-gray-700 rounded-md overflow-hidden">
                    <CodeEditor value={fixCode} onChange={setFixCode} language="solidity" />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="btn-cyber-secondary bg-transparent"
                    onClick={() => setSelectedBounty(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !fixCode || !fixDescription || !isConnected}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Fix"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

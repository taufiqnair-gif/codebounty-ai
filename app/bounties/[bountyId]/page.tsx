"use client"

import { CardDescription } from "@/components/ui/card"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type Bounty, BountyStatus } from "@/types/bounty"
import { getBountyById, submitBounty, updateSubmissionStatus } from "@/lib/bounty-service"
import { Loader2, ExternalLink, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useWallet } from "@/hooks/use-wallet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function BountyDetailsPage() {
  const params = useParams()
  const bountyId = params.bountyId as string
  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionDescription, setSubmissionDescription] = useState("")
  const [auditReportLink, setAuditReportLink] = useState("")
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const router = useRouter()
  const { address, isConnected } = useWallet()

  useEffect(() => {
    if (bountyId) {
      fetchBountyDetails()
    } else {
      setLoading(false)
      setError("No bounty ID provided.")
    }
  }, [bountyId])

  const fetchBountyDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchedBounty = await getBountyById(bountyId)
      setBounty(fetchedBounty)
    } catch (err) {
      console.error("Failed to fetch bounty details:", err)
      setError("Failed to load bounty details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!address) {
      setError("Please connect your wallet to submit.")
      return
    }
    if (!submissionDescription.trim()) {
      setError("Please provide a description for your submission.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await submitBounty(bountyId, {
        hunterAddress: address,
        description: submissionDescription,
        auditReportLink: auditReportLink || undefined,
      })
      setSubmissionDescription("")
      setAuditReportLink("")
      setIsSubmitDialogOpen(false)
      await fetchBountyDetails() // Refresh bounty details to show new submission
    } catch (err) {
      console.error("Failed to submit bounty:", err)
      setError("Failed to submit bounty. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmissionStatusUpdate = async (submissionId: string, status: "Approved" | "Rejected") => {
    setLoading(true) // Use general loading for re-fetching
    setError(null)
    try {
      await updateSubmissionStatus(bountyId, submissionId, status)
      await fetchBountyDetails() // Refresh bounty details
    } catch (err) {
      console.error(`Failed to update submission status to ${status}:`, err)
      setError(`Failed to update submission status. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">Loading bounty details...</span>
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

  if (!bounty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <p className="text-lg text-muted-foreground">Bounty not found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const isOwner = address && bounty.postedBy.toLowerCase() === address.toLowerCase()

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6 btn-cyber-secondary">
        &larr; Back to Bounties
      </Button>

      <Card className="card-cyber mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-bold text-cyber-glow">{bounty.title}</CardTitle>
            <Badge
              className={
                bounty.status === BountyStatus.Open
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }
            >
              {bounty.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">{bounty.description}</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-primary font-semibold">Reward:</p>
            <p className="text-green-400 text-xl font-bold">{bounty.reward}</p>
          </div>
          <div>
            <p className="text-primary font-semibold">Due Date:</p>
            <p className="text-muted-foreground">{format(new Date(bounty.dueDate), "PPP")}</p>
          </div>
          <div>
            <p className="text-primary font-semibold">Posted By:</p>
            <p className="text-muted-foreground font-mono">{bounty.postedBy}</p>
          </div>
          <div>
            <p className="text-primary font-semibold">Code Link:</p>
            <Link
              href={bounty.codeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex items-center"
            >
              View Code <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div>
            <p className="text-primary font-semibold">Tags:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {bounty.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="bg-muted text-muted-foreground border-border">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-center mb-4">{error}</p>}

      {/* Hunter Submission Section */}
      {!isOwner && bounty.status === BountyStatus.Open && (
        <Card className="card-cyber mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Submit Your Fix</CardTitle>
            <CardDescription className="text-muted-foreground">
              Found a solution? Submit your audit report or code fix here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="text-center py-4">
                <p className="text-red-400 mb-4">Please connect your wallet to submit a fix.</p>
                {/* ConnectButton is in components/connect-button.tsx, but not imported here. */}
                {/* Assuming there's a global way to trigger connect or it's handled by layout */}
                <Button onClick={() => alert("Connect wallet functionality goes here")} className="btn-cyber-primary">
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-cyber-primary w-full">Submit Solution</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] card-cyber">
                  <DialogHeader>
                    <DialogTitle className="text-primary">Submit Solution for {bounty.title}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Provide details about your fix or audit report.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="submissionDescription" className="text-right text-muted-foreground">
                        Description
                      </Label>
                      <Textarea
                        id="submissionDescription"
                        value={submissionDescription}
                        onChange={(e) => setSubmissionDescription(e.target.value)}
                        className="col-span-3 input-cyber min-h-[100px]"
                        placeholder="Describe your findings and proposed fix..."
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="auditReportLink" className="text-right text-muted-foreground">
                        Report Link (Optional)
                      </Label>
                      <Input
                        id="auditReportLink"
                        value={auditReportLink}
                        onChange={(e) => setAuditReportLink(e.target.value)}
                        className="col-span-3 input-cyber"
                        placeholder="Link to your detailed audit report or code changes"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !submissionDescription.trim()}
                      className="btn-cyber-primary"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Fix"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submissions Section (Visible to all, but actions only for owner) */}
      <Card className="card-cyber">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">
            Submissions ({bounty.submissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bounty.submissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No submissions yet for this bounty.</p>
          ) : (
            <div className="space-y-4">
              {bounty.submissions.map((submission) => (
                <div key={submission.id} className="border border-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white">
                      Hunter:{" "}
                      <span className="font-mono text-blue-400">
                        {submission.hunterAddress.slice(0, 6)}...{submission.hunterAddress.slice(-4)}
                      </span>
                    </h3>
                    {bounty.status === BountyStatus.Closed ? (
                      <Badge
                        className={
                          submission.status === "Approved"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }
                      >
                        {submission.status}
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{submission.status}</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">{submission.description}</p>
                  {submission.auditReportLink && (
                    <Link
                      href={submission.auditReportLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center text-sm mb-3"
                    >
                      View Report <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  )}
                  <p className="text-xs text-gray-500">
                    Submitted on: {format(new Date(submission.submissionDate), "PPP")}
                  </p>

                  {isOwner && submission.status === "Pending" && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleSubmissionStatusUpdate(submission.id, "Approved")}
                        className="btn-cyber-primary"
                        disabled={loading}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        onClick={() => handleSubmissionStatusUpdate(submission.id, "Rejected")}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                        disabled={loading}
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

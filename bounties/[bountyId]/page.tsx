"use client"

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
  const isBountyOpen = bounty.status === BountyStatus.Open
  const hasSubmissions = bounty.submissions && bounty.submissions.length > 0

  return (
    <div className="container mx-auto px-4 py-8">
      <Button onClick={() => router.back()} variant="outline" className="btn-cyber-secondary mb-6">
        &larr; Back to Bounties
      </Button>

      <Card className="card-cyber mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">{bounty.title}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge
              className={
                bounty.status === BountyStatus.Open
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }
            >
              {bounty.status}
            </Badge>
            {bounty.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="bg-muted text-muted-foreground border-border">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{bounty.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-primary">Reward:</p>
              <p className="text-foreground">{bounty.reward}</p>
            </div>
            <div>
              <p className="font-semibold text-primary">Due Date:</p>
              <p className="text-foreground">{format(new Date(bounty.dueDate), "PPP")}</p>
            </div>
            <div>
              <p className="font-semibold text-primary">Posted By:</p>
              <p className="text-foreground">{bounty.postedBy}</p>
            </div>
            <div>
              <p className="font-semibold text-primary">Code Link:</p>
              <Link
                href={bounty.codeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                View Code <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {isBountyOpen && !isOwner && isConnected && (
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-cyber-primary w-full md:w-auto">Submit Solution</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] card-cyber">
                <DialogHeader>
                  <DialogTitle className="text-primary">Submit Your Solution</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Provide details about your findings and link to your audit report.
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
                      placeholder="Describe your findings and solution..."
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="auditReportLink" className="text-right text-muted-foreground">
                      Audit Report Link
                    </Label>
                    <Input
                      id="auditReportLink"
                      value={auditReportLink}
                      onChange={(e) => setAuditReportLink(e.target.value)}
                      className="col-span-3 input-cyber"
                      placeholder="Link to your detailed audit report (optional)"
                    />
                  </div>
                  {error && <p className="text-destructive text-center col-span-4">{error}</p>}
                </div>
                <DialogFooter>
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="btn-cyber-primary">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Solution"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {!isConnected && !isOwner && (
            <p className="text-muted-foreground text-center">Connect your wallet to submit a solution.</p>
          )}
          {!isBountyOpen && (
            <p className="text-muted-foreground text-center">This bounty is currently closed for submissions.</p>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasSubmissions ? (
              <p className="text-muted-foreground">No submissions yet for this bounty.</p>
            ) : (
              <div className="space-y-4">
                {bounty.submissions.map((submission) => (
                  <Card key={submission.id} className="card-cyber bg-card/70">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-primary">Hunter: {submission.hunterAddress}</p>
                          <p className="text-sm text-muted-foreground">
                            Submitted: {format(new Date(submission.submissionDate), "PPP p")}
                          </p>
                        </div>
                        <Badge
                          className={
                            submission.status === "Approved"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : submission.status === "Rejected"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }
                        >
                          {submission.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{submission.description}</p>
                      {submission.auditReportLink && (
                        <Link
                          href={submission.auditReportLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                        >
                          View Audit Report <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                      {submission.status === "Pending" && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            className="btn-cyber-primary"
                            onClick={() => handleSubmissionStatusUpdate(submission.id, "Approved")}
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            className="btn-cyber-secondary bg-transparent"
                            onClick={() => handleSubmissionStatusUpdate(submission.id, "Rejected")}
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

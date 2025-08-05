"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { FileText, Upload, Loader2, Code, LinkIcon } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { BountyService } from "@/lib/bounty-service"
import type { Bounty } from "@/types/bounty"
import { CodeEditor } from "@/components/code-editor"

export default function SubmitAuditPage() {
  const [bountyId, setBountyId] = useState("")
  const [auditReportLink, setAuditReportLink] = useState("")
  const [auditDescription, setAuditDescription] = useState("")
  const [auditCode, setAuditCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bounties, setBounties] = useState<Bounty[]>([])
  const { toast } = useToast()
  const { isConnected, address, provider, signer } = useWallet()

  useEffect(() => {
    const fetchBounties = async () => {
      if (isConnected && provider) {
        try {
          const bountyService = new BountyService(provider)
          const fetchedBounties = await bountyService.getBounties()
          setBounties(fetchedBounties.filter((b) => b.status === "Open")) // Only show open bounties
        } catch (error) {
          console.error("Failed to fetch bounties:", error)
        }
      }
    }
    fetchBounties()
  }, [isConnected, provider])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bountyId || !auditReportLink || !auditDescription || !isConnected || !address || !signer) {
      toast({
        title: "Missing Information or Wallet Not Connected",
        description: "Please fill all fields and connect your wallet.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const bountyService = new BountyService(provider!, signer!)
      await bountyService.submitBounty(bountyId, {
        hunterAddress: address,
        description: auditDescription,
        auditReportLink: auditReportLink,
      })

      toast({
        title: "Audit Submitted",
        description: "Your audit solution has been successfully submitted!",
      })
      setBountyId("")
      setAuditReportLink("")
      setAuditDescription("")
      setAuditCode("")
    } catch (error) {
      console.error("Failed to submit audit:", error)
      toast({
        title: "Error",
        description: "Failed to submit audit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">Submit Audit Solution</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto mb-10">
        Submit your comprehensive audit report and fixed code for an active bounty.
      </p>

      <Card className="card-cyber max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary flex items-center gap-2">
            <Upload className="h-6 w-6" /> Submission Details
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Provide the link to your audit report and a description of your findings/fixes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bounty-select" className="text-muted-foreground flex items-center">
                <FileText className="h-4 w-4 mr-2" /> Select Bounty
              </Label>
              <select
                id="bounty-select"
                value={bountyId}
                onChange={(e) => setBountyId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                required
              >
                <option value="">-- Select an open bounty --</option>
                {bounties.map((bounty) => (
                  <option key={bounty.id} value={bounty.id}>
                    {bounty.title} (Reward: {bounty.reward})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit-report-link" className="text-muted-foreground flex items-center">
                <LinkIcon className="h-4 w-4 mr-2" /> Audit Report Link (e.g., IPFS CID, GitHub Gist)
              </Label>
              <Input
                id="audit-report-link"
                type="url"
                placeholder="https://ipfs.io/ipfs/your-report-cid or https://gist.github.com/your-report"
                value={auditReportLink}
                onChange={(e) => setAuditReportLink(e.target.value)}
                className="input-cyber"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit-description" className="text-muted-foreground flex items-center">
                <FileText className="h-4 w-4 mr-2" /> Description of Fixes/Findings
              </Label>
              <Textarea
                id="audit-description"
                placeholder="Summarize your audit findings, the vulnerabilities addressed, and how your fix resolves them."
                value={auditDescription}
                onChange={(e) => setAuditDescription(e.target.value)}
                className="min-h-[120px] bg-gray-800 border-gray-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit-code" className="text-muted-foreground flex items-center">
                <Code className="h-4 w-4 mr-2" /> Fixed Code (Optional, for direct submission)
              </Label>
              <div className="h-[300px] border border-gray-700 rounded-md overflow-hidden">
                <CodeEditor value={auditCode} onChange={setAuditCode} language="solidity" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You can paste the fixed code here directly, or provide a link above.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !isConnected}
              className="btn-cyber-primary w-full text-lg py-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Audit...
                </>
              ) : (
                "Submit Audit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

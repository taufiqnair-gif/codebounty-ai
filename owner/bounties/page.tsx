"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { type Bounty, BountyStatus } from "@/types/bounty"
import { createBounty, getBounties, updateBountyStatus } from "@/lib/bounty-service"
import { Loader2, PlusCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default function OwnerBountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newBounty, setNewBounty] = useState({
    title: "",
    description: "",
    reward: "",
    dueDate: "",
    codeLink: "",
    tags: "",
    postedBy: "0xOwnerAddress", // Mock owner address
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreatingBounty, setIsCreatingBounty] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchBounties()
  }, [])

  const fetchBounties = async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchedBounties = await getBounties()
      setBounties(fetchedBounties)
    } catch (err) {
      console.error("Failed to fetch bounties:", err)
      setError("Failed to load bounties. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setNewBounty((prev) => ({ ...prev, [id]: value }))
  }

  const handleCreateBounty = async () => {
    setIsCreatingBounty(true)
    setError(null)
    try {
      const tagsArray = newBounty.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
      const createdBounty = await createBounty({
        ...newBounty,
        tags: tagsArray,
        dueDate: new Date(newBounty.dueDate).toISOString(),
      })
      setBounties((prev) => [...prev, createdBounty])
      setNewBounty({
        title: "",
        description: "",
        reward: "",
        dueDate: "",
        codeLink: "",
        tags: "",
        postedBy: "0xOwnerAddress",
      })
      setIsDialogOpen(false)
    } catch (err) {
      console.error("Failed to create bounty:", err)
      setError("Failed to create bounty. Please try again.")
    } finally {
      setIsCreatingBounty(false)
    }
  }

  const handleToggleBountyStatus = async (bountyId: string, currentStatus: BountyStatus) => {
    setLoading(true)
    setError(null)
    try {
      const newStatus = currentStatus === BountyStatus.Open ? BountyStatus.Closed : BountyStatus.Open
      await updateBountyStatus(bountyId, newStatus)
      await fetchBounties() // Re-fetch to get updated status
    } catch (err) {
      console.error("Failed to update bounty status:", err)
      setError("Failed to update bounty status. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loading && bounties.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">Loading bounties...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-cyber-glow">Manage Bounties</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-cyber-primary">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Bounty
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] card-cyber">
            <DialogHeader>
              <DialogTitle className="text-primary">Create New Bounty</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Fill in the details for your new smart contract bounty.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right text-muted-foreground">
                  Title
                </Label>
                <Input
                  id="title"
                  value={newBounty.title}
                  onChange={handleInputChange}
                  className="col-span-3 input-cyber"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newBounty.description}
                  onChange={handleInputChange}
                  className="col-span-3 input-cyber min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reward" className="text-right text-muted-foreground">
                  Reward
                </Label>
                <Input
                  id="reward"
                  value={newBounty.reward}
                  onChange={handleInputChange}
                  className="col-span-3 input-cyber"
                  placeholder="e.g., 1000 USDC or 5 ETH"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right text-muted-foreground">
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newBounty.dueDate}
                  onChange={handleInputChange}
                  className="col-span-3 input-cyber"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="codeLink" className="text-right text-muted-foreground">
                  Code Link
                </Label>
                <Input
                  id="codeLink"
                  value={newBounty.codeLink}
                  onChange={handleInputChange}
                  className="col-span-3 input-cyber"
                  placeholder="Link to GitHub repo or contract"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags" className="text-right text-muted-foreground">
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={newBounty.tags}
                  onChange={handleInputChange}
                  className="col-span-3 input-cyber"
                  placeholder="Comma-separated: DeFi, NFT, Audit"
                />
              </div>
              {error && <p className="text-destructive text-center col-span-4">{error}</p>}
            </div>
            <DialogFooter>
              <Button onClick={handleCreateBounty} disabled={isCreatingBounty} className="btn-cyber-primary">
                {isCreatingBounty ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Bounty"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && <p className="text-destructive text-center mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bounties.map((bounty) => (
          <Card key={bounty.id} className="card-cyber flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-primary">{bounty.title}</CardTitle>
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
            <CardContent className="flex-grow flex flex-col justify-between">
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{bounty.description}</p>
              <div className="text-sm text-foreground mb-2">
                <span className="font-semibold text-primary">Reward:</span> {bounty.reward}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                <span className="font-semibold text-primary">Due:</span> {format(new Date(bounty.dueDate), "PPP")}
              </div>
              <div className="flex gap-2 mt-auto">
                <Button
                  variant="outline"
                  className="btn-cyber-secondary flex-grow bg-transparent"
                  onClick={() => router.push(`/bounties/${bounty.id}`)}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  className={`flex-grow ${bounty.status === BountyStatus.Open ? "btn-cyber-secondary" : "btn-cyber-primary"}`}
                  onClick={() => handleToggleBountyStatus(bounty.id, bounty.status)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : bounty.status === BountyStatus.Open ? (
                    "Close Bounty"
                  ) : (
                    "Reopen Bounty"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {bounties.length === 0 && !loading && (
          <p className="text-muted-foreground text-center col-span-full">No bounties created yet. Create one above!</p>
        )}
      </div>
    </div>
  )
}

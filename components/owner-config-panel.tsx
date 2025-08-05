"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Settings, DollarSign, Percent, Clock, Zap } from "lucide-react"

export function OwnerConfigPanel() {
  const [defaultReward, setDefaultReward] = useState(0.1)
  const [auditFee, setAuditFee] = useState(0.05)
  const [autoApprove, setAutoApprove] = useState(false)
  const [minBountyDuration, setMinBountyDuration] = useState(7)
  const { toast } = useToast()

  const handleSave = () => {
    // In a real application, this would interact with a backend or smart contract
    console.log("Saving owner configurations:", {
      defaultReward,
      auditFee,
      autoApprove,
      minBountyDuration,
    })
    toast({
      title: "Settings Saved",
      description: "Your owner configurations have been updated.",
    })
  }

  return (
    <Card className="card-cyber">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
          <Settings className="h-5 w-5" /> Owner Configurations
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Manage default settings for bounties and audits.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="default-reward" className="text-muted-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-2" /> Default Reward (ETH)
            </Label>
            <Input
              id="default-reward"
              type="number"
              step="0.01"
              value={defaultReward}
              onChange={(e) => setDefaultReward(Number.parseFloat(e.target.value))}
              className="input-cyber"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-fee" className="text-muted-foreground flex items-center">
              <Percent className="h-4 w-4 mr-2" /> Audit Fee (%)
            </Label>
            <Input
              id="audit-fee"
              type="number"
              step="0.01"
              value={auditFee}
              onChange={(e) => setAuditFee(Number.parseFloat(e.target.value))}
              className="input-cyber"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="min-bounty-duration" className="text-muted-foreground flex items-center">
            <Clock className="h-4 w-4 mr-2" /> Minimum Bounty Duration (Days)
          </Label>
          <Input
            id="min-bounty-duration"
            type="number"
            step="1"
            value={minBountyDuration}
            onChange={(e) => setMinBountyDuration(Number.parseInt(e.target.value))}
            className="input-cyber"
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="auto-approve" className="text-muted-foreground flex items-center">
            <Zap className="h-4 w-4 mr-2" /> Auto-Approve Submissions
          </Label>
          <Switch id="auto-approve" checked={autoApprove} onCheckedChange={setAutoApprove} />
        </div>

        <Button onClick={handleSave} className="btn-cyber-primary w-full">
          Save Configurations
        </Button>
      </CardContent>
    </Card>
  )
}

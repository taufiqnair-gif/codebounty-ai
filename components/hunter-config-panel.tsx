"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Settings, Bell, Code, Wallet, Zap } from "lucide-react"

export function HunterConfigPanel() {
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [preferredLanguages, setPreferredLanguages] = useState("Solidity, Vyper")
  const [minRewardThreshold, setMinRewardThreshold] = useState(0.05)
  const [autoClaimRewards, setAutoClaimRewards] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    // In a real application, this would interact with a backend or user preferences storage
    console.log("Saving hunter configurations:", {
      notificationEnabled,
      preferredLanguages,
      minRewardThreshold,
      autoClaimRewards,
    })
    toast({
      title: "Settings Saved",
      description: "Your hunter configurations have been updated.",
    })
  }

  return (
    <Card className="card-cyber">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
          <Settings className="h-5 w-5" /> Hunter Configurations
        </CardTitle>
        <CardDescription className="text-muted-foreground">Customize your bounty hunting experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="notifications" className="text-muted-foreground flex items-center">
            <Bell className="h-4 w-4 mr-2" /> Enable Notifications
          </Label>
          <Switch id="notifications" checked={notificationEnabled} onCheckedChange={setNotificationEnabled} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferred-languages" className="text-muted-foreground flex items-center">
            <Code className="h-4 w-4 mr-2" /> Preferred Languages (comma-separated)
          </Label>
          <Input
            id="preferred-languages"
            type="text"
            value={preferredLanguages}
            onChange={(e) => setPreferredLanguages(e.target.value)}
            className="input-cyber"
            placeholder="e.g., Solidity, Vyper, Rust"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="min-reward" className="text-muted-foreground flex items-center">
            <Wallet className="h-4 w-4 mr-2" /> Minimum Reward Threshold (ETH)
          </Label>
          <Input
            id="min-reward"
            type="number"
            step="0.01"
            value={minRewardThreshold}
            onChange={(e) => setMinRewardThreshold(Number.parseFloat(e.target.value))}
            className="input-cyber"
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="auto-claim" className="text-muted-foreground flex items-center">
            <Zap className="h-4 w-4 mr-2" /> Auto-Claim Approved Rewards
          </Label>
          <Switch id="auto-claim" checked={autoClaimRewards} onCheckedChange={setAutoClaimRewards} />
        </div>

        <Button onClick={handleSave} className="btn-cyber-primary w-full">
          Save Configurations
        </Button>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Target, DollarSign, Clock, CheckCircle, Code, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CreateBountyPage() {
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    contractAddress: "",
    rewardAmount: "",
    duration: "",
    severity: "",
    requirements: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const createBounty = async () => {
    setIsCreating(true)

    // Simulate contract interaction
    try {
      // Step 1: Validate inputs
      setStep(1)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Step 2: Deploy bounty contract
      setStep(2)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Step 3: Initialize vault
      setStep(3)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Step 4: Emit events
      setStep(4)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Bounty Created Successfully!",
        description: `Bounty "${formData.title}" is now live with ${formData.rewardAmount} USDC reward.`,
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        contractAddress: "",
        rewardAmount: "",
        duration: "",
        severity: "",
        requirements: "",
      })
      setStep(1)
    } catch (error) {
      toast({
        title: "Error Creating Bounty",
        description: "Please try again or contact support.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const isFormValid =
    formData.title &&
    formData.description &&
    formData.contractAddress &&
    formData.rewardAmount &&
    formData.duration &&
    formData.severity

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Target className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Create Bug Bounty</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-cyber">
            <CardHeader>
              <CardTitle>Bounty Details</CardTitle>
              <CardDescription>
                Provide comprehensive information about your smart contract and the bounty program
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Bounty Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., DeFi Protocol Security Audit"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="input-cyber"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project, what you're looking for, and any specific areas of concern..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="input-cyber min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract">Smart Contract Address</Label>
                <Input
                  id="contract"
                  placeholder="0x..."
                  value={formData.contractAddress}
                  onChange={(e) => handleInputChange("contractAddress", e.target.value)}
                  className="input-cyber"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reward">Reward Amount (USDC)</Label>
                  <Input
                    id="reward"
                    type="number"
                    placeholder="50000"
                    value={formData.rewardAmount}
                    onChange={(e) => handleInputChange("rewardAmount", e.target.value)}
                    className="input-cyber"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Days)</Label>
                  <Select onValueChange={(value) => handleInputChange("duration", value)}>
                    <SelectTrigger className="input-cyber">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Minimum Severity Level</Label>
                <Select onValueChange={(value) => handleInputChange("severity", value)}>
                  <SelectTrigger className="input-cyber">
                    <SelectValue placeholder="Select minimum severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Informational issues</SelectItem>
                    <SelectItem value="medium">Medium - Minor vulnerabilities</SelectItem>
                    <SelectItem value="high">High - Significant vulnerabilities</SelectItem>
                    <SelectItem value="critical">Critical - Severe vulnerabilities only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Special Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Any specific requirements, testing environments, or submission guidelines..."
                  value={formData.requirements}
                  onChange={(e) => handleInputChange("requirements", e.target.value)}
                  className="input-cyber"
                />
              </div>
            </CardContent>
          </Card>

          {/* Creation Progress */}
          {isCreating && (
            <Card className="card-cyber">
              <CardHeader>
                <CardTitle>Creating Bounty...</CardTitle>
                <CardDescription>Please wait while we deploy your bounty to the blockchain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {step >= 1 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                    <span className={step >= 1 ? "text-green-500" : "text-muted-foreground"}>Validating inputs</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {step >= 2 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : step === 2 ? (
                      <div className="h-5 w-5 rounded-full border-2 border-primary animate-spin" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                    <span
                      className={step >= 2 ? "text-green-500" : step === 2 ? "text-primary" : "text-muted-foreground"}
                    >
                      Deploying bounty contract
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {step >= 3 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : step === 3 ? (
                      <div className="h-5 w-5 rounded-full border-2 border-primary animate-spin" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                    <span
                      className={step >= 3 ? "text-green-500" : step === 3 ? "text-primary" : "text-muted-foreground"}
                    >
                      Initializing vault
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {step >= 4 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : step === 4 ? (
                      <div className="h-5 w-5 rounded-full border-2 border-primary animate-spin" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                    <span
                      className={step >= 4 ? "text-green-500" : step === 4 ? "text-primary" : "text-muted-foreground"}
                    >
                      Emitting events
                    </span>
                  </div>
                </div>
                <Progress value={(step / 4) * 100} className="h-2" />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          <Card className="card-cyber">
            <CardHeader>
              <CardTitle>Bounty Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Title</div>
                <div className="font-medium">{formData.title || "Untitled Bounty"}</div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Reward</div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="font-bold text-cyber-glow">
                    {formData.rewardAmount ? `$${Number.parseInt(formData.rewardAmount).toLocaleString()}` : "$0"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Duration</div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>{formData.duration ? `${formData.duration} days` : "Not set"}</span>
                </div>
              </div>

              {formData.severity && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Min Severity</div>
                  <Badge
                    variant={
                      formData.severity === "critical"
                        ? "destructive"
                        : formData.severity === "high"
                          ? "default"
                          : formData.severity === "medium"
                            ? "secondary"
                            : "outline"
                    }
                  >
                    {formData.severity.charAt(0).toUpperCase() + formData.severity.slice(1)}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Smart Contract Info */}
          <Card className="card-cyber">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5" />
                <span>Smart Contract</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">BountyFactory</span>
                  <Badge variant="outline">Ready</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">BountyVault</span>
                  <Badge variant="outline">Ready</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gas Estimate</span>
                  <span className="text-cyber-glow">~0.02 ETH</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button
            onClick={createBounty}
            disabled={!isFormValid || isCreating}
            className="w-full btn-cyber-primary"
            size="lg"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating Bounty...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Create Bounty
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

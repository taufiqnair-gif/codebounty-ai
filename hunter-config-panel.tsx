"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { getContractInstance } from "@/lib/contract-service"
import type { BountyTokenContract } from "@/types/contracts"
import { toast } from "@/components/ui/use-toast"
import { ethers } from "ethers"

export function HunterConfigPanel() {
  const { signer, address, isConnected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [tokenAmount, setTokenAmount] = useState("")
  const [allowanceAmount, setAllowanceAmount] = useState("")
  const [spenderAddress, setSpenderAddress] = useState("")

  const handleMintTokens = async () => {
    if (!signer || !tokenAmount || !address) {
      toast({
        title: "Error",
        description: "Please connect wallet and enter an amount.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const bountyToken = getContractInstance<BountyTokenContract>("BountyToken", signer)
      const amount = ethers.parseUnits(tokenAmount, 18) // Assuming 18 decimals
      const tx = await bountyToken.mint(address, amount)
      await tx.wait()
      toast({
        title: "Success",
        description: `Successfully minted ${tokenAmount} Bounty Tokens!`,
      })
      setTokenAmount("")
    } catch (error: any) {
      console.error("Failed to mint tokens:", error)
      toast({
        title: "Error",
        description: `Failed to mint tokens: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTokens = async () => {
    if (!signer || !allowanceAmount || !spenderAddress) {
      toast({
        title: "Error",
        description: "Please connect wallet, enter amount, and spender address.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const bountyToken = getContractInstance<BountyTokenContract>("BountyToken", signer)
      const amount = ethers.parseUnits(allowanceAmount, 18) // Assuming 18 decimals
      const tx = await bountyToken.approve(spenderAddress, amount)
      await tx.wait()
      toast({
        title: "Success",
        description: `Successfully approved ${allowanceAmount} Bounty Tokens for ${spenderAddress}!`,
      })
      setAllowanceAmount("")
      setSpenderAddress("")
    } catch (error: any) {
      console.error("Failed to approve tokens:", error)
      toast({
        title: "Error",
        description: `Failed to approve tokens: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="card-cyber">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Hunter Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mint-tokens" className="text-muted-foreground">
            Mint Test Bounty Tokens
          </Label>
          <div className="flex gap-2">
            <Input
              id="mint-tokens"
              type="number"
              placeholder="Amount to mint"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              className="input-cyber"
              disabled={!isConnected || loading}
            />
            <Button onClick={handleMintTokens} disabled={!isConnected || loading} className="btn-cyber-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mint Tokens"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="approve-tokens" className="text-muted-foreground">
            Approve Bounty Tokens for a Spender
          </Label>
          <div className="flex flex-col gap-2">
            <Input
              id="spender-address"
              type="text"
              placeholder="Spender Address (e.g., AutoBountyManager contract)"
              value={spenderAddress}
              onChange={(e) => setSpenderAddress(e.target.value)}
              className="input-cyber"
              disabled={!isConnected || loading}
            />
            <Input
              id="allowance-amount"
              type="number"
              placeholder="Amount to approve"
              value={allowanceAmount}
              onChange={(e) => setAllowanceAmount(e.target.value)}
              className="input-cyber"
              disabled={!isConnected || loading}
            />
            <Button onClick={handleApproveTokens} disabled={!isConnected || loading} className="btn-cyber-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve Tokens"}
            </Button>
          </div>
        </div>

        {!isConnected && <p className="text-center text-muted-foreground">Connect your wallet to use hunter tools.</p>}
      </CardContent>
    </Card>
  )
}

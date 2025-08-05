"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { getContractInstance } from "@/lib/contract-service"
import type { AutoBountyManagerContract } from "@/types/contracts"
import { toast } from "@/components/ui/use-toast"

export function OwnerConfigPanel() {
  const { signer, isConnected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [newFee, setNewFee] = useState("")
  const [newOracleAddress, setNewOracleAddress] = useState("")

  const handleUpdateFee = async () => {
    if (!signer || !newFee) {
      toast({
        title: "Error",
        description: "Please connect wallet and enter a fee.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const autoBountyManager = getContractInstance<AutoBountyManagerContract>("AutoBountyManager", signer)
      // Assuming setPlatformFee takes a BigNumberish value
      const tx = await autoBountyManager.setPlatformFee(BigInt(newFee))
      await tx.wait()
      toast({
        title: "Success",
        description: "Platform fee updated successfully!",
      })
      setNewFee("")
    } catch (error: any) {
      console.error("Failed to update platform fee:", error)
      toast({
        title: "Error",
        description: `Failed to update platform fee: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOracleAddress = async () => {
    if (!signer || !newOracleAddress) {
      toast({
        title: "Error",
        description: "Please connect wallet and enter an oracle address.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const autoBountyManager = getContractInstance<AutoBountyManagerContract>("AutoBountyManager", signer)
      const tx = await autoBountyManager.setAuditEngineAddress(newOracleAddress) // Assuming this function exists
      await tx.wait()
      toast({
        title: "Success",
        description: "Audit Engine (Oracle) address updated successfully!",
      })
      setNewOracleAddress("")
    } catch (error: any) {
      console.error("Failed to update oracle address:", error)
      toast({
        title: "Error",
        description: `Failed to update oracle address: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="card-cyber">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Owner Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="platform-fee" className="text-muted-foreground">
            Set Platform Fee (Basis Points)
          </Label>
          <div className="flex gap-2">
            <Input
              id="platform-fee"
              type="number"
              placeholder="e.g., 500 (for 5%)"
              value={newFee}
              onChange={(e) => setNewFee(e.target.value)}
              className="input-cyber"
              disabled={!isConnected || loading}
            />
            <Button onClick={handleUpdateFee} disabled={!isConnected || loading} className="btn-cyber-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Fee"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="oracle-address" className="text-muted-foreground">
            Set Audit Engine (Oracle) Address
          </Label>
          <div className="flex gap-2">
            <Input
              id="oracle-address"
              type="text"
              placeholder="0x..."
              value={newOracleAddress}
              onChange={(e) => setNewOracleAddress(e.target.value)}
              className="input-cyber"
              disabled={!isConnected || loading}
            />
            <Button
              onClick={handleUpdateOracleAddress}
              disabled={!isConnected || loading}
              className="btn-cyber-primary"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Address"}
            </Button>
          </div>
        </div>

        {!isConnected && (
          <p className="text-center text-muted-foreground">Connect your wallet to manage configurations.</p>
        )}
      </CardContent>
    </Card>
  )
}

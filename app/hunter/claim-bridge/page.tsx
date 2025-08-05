"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Wallet, Network } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { ContractService } from "@/lib/contract-service"

interface Reward {
  bountyId: string
  amount: string
  status: "Claimable" | "Claimed" | "Pending"
}

export default function ClaimBridgeRewardPage() {
  const [claimableRewards, setClaimableRewards] = useState<Reward[]>([])
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [targetChain, setTargetChain] = useState("Ethereum Mainnet")
  const [targetToken, setTargetToken] = useState("USDC")
  const [isClaiming, setIsClaiming] = useState(false)
  const [isBridging, setIsBridging] = useState(false)
  const { toast } = useToast()
  const { isConnected, address, provider, signer } = useWallet()

  useEffect(() => {
    const fetchClaimableRewards = async () => {
      if (!isConnected || !address || !provider) {
        setClaimableRewards([])
        return
      }
      try {
        const contractService = new ContractService(provider, await provider.getSigner())
        // Mock fetching claimable rewards
        const mockRewards: Reward[] = [
          { bountyId: "bounty-123", amount: "50.00 BTY", status: "Claimable" },
          { bountyId: "bounty-456", amount: "120.50 BTY", status: "Claimable" },
          { bountyId: "bounty-789", amount: "75.00 BTY", status: "Claimed" },
        ]
        setClaimableRewards(mockRewards.filter((r) => r.status === "Claimable"))
      } catch (error) {
        console.error("Failed to fetch claimable rewards:", error)
        setClaimableRewards([])
      }
    }
    fetchClaimableRewards()
  }, [isConnected, address, provider])

  const handleClaimReward = async (reward: Reward) => {
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim rewards.",
        variant: "destructive",
      })
      return
    }

    setIsClaiming(true)
    try {
      const contractService = new ContractService(provider!, signer!)
      // In a real scenario, this would call BountyZap.zapClaim or similar
      console.log(`Claiming reward for bounty ${reward.bountyId} - ${reward.amount}`)
      await new Promise((resolve) => setTimeout(resolve, 3000)) // Simulate blockchain tx

      setClaimableRewards((prev) => prev.filter((r) => r.bountyId !== reward.bountyId))
      toast({
        title: "Reward Claimed!",
        description: `${reward.amount} has been successfully claimed to your wallet.`,
      })
    } catch (error) {
      console.error("Failed to claim reward:", error)
      toast({
        title: "Error",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClaiming(false)
    }
  }

  const handleBridgeReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReward || !targetChain || !targetToken || !isConnected || !signer) {
      toast({
        title: "Missing Information or Wallet Not Connected",
        description: "Please select a reward, target chain/token, and connect your wallet.",
        variant: "destructive",
      })
      return
    }

    setIsBridging(true)
    try {
      const contractService = new ContractService(provider!, signer!)
      // In a real scenario, this would call BountyZap.bridgeReward or integrate with LI.FI
      console.log(
        `Bridging ${selectedReward.amount} from ${selectedReward.bountyId} to ${targetChain} as ${targetToken}`,
      )
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Simulate bridging tx

      setClaimableRewards((prev) => prev.filter((r) => r.bountyId !== selectedReward.bountyId))
      toast({
        title: "Reward Bridged!",
        description: `${selectedReward.amount} has been successfully bridged to ${targetChain} as ${targetToken}.`,
      })
      setSelectedReward(null)
    } catch (error) {
      console.error("Failed to bridge reward:", error)
      toast({
        title: "Error",
        description: "Failed to bridge reward. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBridging(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">Claim & Bridge Rewards</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto mb-10">
        Instantly claim your earned bounty rewards and bridge them to any chain or token using our integrated ZAP
        feature.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Claimable Rewards
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Rewards from completed bounties ready for claiming.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected || !address ? (
              <div className="text-center py-8 text-muted-foreground">
                Connect your wallet to see claimable rewards.
              </div>
            ) : claimableRewards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No claimable rewards at the moment.</div>
            ) : (
              claimableRewards.map((reward) => (
                <div
                  key={reward.bountyId}
                  className="p-4 border border-gray-700 rounded-md bg-gray-900/30 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-white">Bounty ID: {reward.bountyId}</p>
                    <p className="text-lg font-bold text-green-400">{reward.amount}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="btn-cyber-primary"
                      onClick={() => handleClaimReward(reward)}
                      disabled={isClaiming}
                    >
                      {isClaiming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="btn-cyber-secondary bg-transparent"
                      onClick={() => setSelectedReward(reward)}
                      disabled={isClaiming}
                    >
                      Bridge
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <Network className="h-5 w-5" /> Bridge Reward
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Bridge your claimed rewards to a different chain or token.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedReward ? (
              <div className="text-center py-8 text-muted-foreground">Select a claimable reward to bridge it.</div>
            ) : (
              <form onSubmit={handleBridgeReward} className="space-y-4">
                <div className="p-4 rounded-md bg-gray-800/50 border border-gray-700">
                  <p className="text-sm text-muted-foreground">
                    Bridging: <span className="text-white font-medium">{selectedReward.amount}</span> from Bounty{" "}
                    <span className="text-white font-medium">{selectedReward.bountyId}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-chain" className="text-muted-foreground">
                    Target Chain
                  </Label>
                  <select
                    id="target-chain"
                    value={targetChain}
                    onChange={(e) => setTargetChain(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                    required
                  >
                    <option value="Ethereum Mainnet">Ethereum Mainnet</option>
                    <option value="Polygon">Polygon</option>
                    <option value="Arbitrum">Arbitrum</option>
                    <option value="Optimism">Optimism</option>
                    <option value="Binance Smart Chain">Binance Smart Chain</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-token" className="text-muted-foreground">
                    Target Token
                  </Label>
                  <select
                    id="target-token"
                    value={targetToken}
                    onChange={(e) => setTargetToken(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                    required
                  >
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                    <option value="DAI">DAI</option>
                    <option value="WETH">WETH</option>
                  </select>
                </div>

                <Button type="submit" disabled={isBridging || !isConnected} className="btn-cyber-primary w-full">
                  {isBridging ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Bridging Reward...
                    </>
                  ) : (
                    "Bridge Reward"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

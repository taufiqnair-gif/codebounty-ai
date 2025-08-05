"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Wallet, LinkIcon, ArrowRight, Loader2, CheckCircle } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { ContractService } from "@/lib/contract-service"

interface LinkedWallet {
  address: string
  linkedDate: string
  xpTransferred: number
}

export default function MultiWalletPage() {
  const [newWalletAddress, setNewWalletAddress] = useState("")
  const [linkedWallets, setLinkedWallets] = useState<LinkedWallet[]>([])
  const [isLinking, setIsLinking] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationSourceWallet, setMigrationSourceWallet] = useState("")
  const { toast } = useToast()
  const { isConnected, address, provider, signer } = useWallet()

  useEffect(() => {
    const fetchLinkedWallets = async () => {
      if (isConnected && address && provider) {
        try {
          const contractService = new ContractService(provider, await provider.getSigner())
          // Mock fetching linked wallets
          const mockLinkedWallets: LinkedWallet[] = [
            { address: "0xAbC123...", linkedDate: "2023-01-15", xpTransferred: 100 },
            { address: "0xDeF456...", linkedDate: "2023-03-20", xpTransferred: 50 },
          ]
          setLinkedWallets(mockLinkedWallets)
        } catch (error) {
          console.error("Failed to fetch linked wallets:", error)
        }
      } else {
        setLinkedWallets([])
      }
    }
    fetchLinkedWallets()
  }, [isConnected, address, provider])

  const handleLinkWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWalletAddress || !isConnected || !signer) {
      toast({
        title: "Missing Information or Wallet Not Connected",
        description: "Please enter a wallet address and connect your wallet.",
        variant: "destructive",
      })
      return
    }

    setIsLinking(true)
    try {
      const contractService = new ContractService(provider!, signer!)
      // In a real scenario, this would call a MultiWalletLinker contract method
      console.log(`Linking wallet: ${newWalletAddress}`)
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate blockchain tx

      const newLinkedWallet: LinkedWallet = {
        address: newWalletAddress,
        linkedDate: new Date().toISOString().split("T")[0],
        xpTransferred: 0, // XP transferred on migration
      }
      setLinkedWallets((prev) => [...prev, newLinkedWallet])
      toast({
        title: "Wallet Linked",
        description: `${newWalletAddress} has been successfully linked to your profile.`,
      })
      setNewWalletAddress("")
    } catch (error) {
      console.error("Failed to link wallet:", error)
      toast({
        title: "Error",
        description: "Failed to link wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLinking(false)
    }
  }

  const handleMigrateIdentity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!migrationSourceWallet || !isConnected || !signer) {
      toast({
        title: "Missing Information or Wallet Not Connected",
        description: "Please select a source wallet and connect your wallet.",
        variant: "destructive",
      })
      return
    }

    setIsMigrating(true)
    try {
      const contractService = new ContractService(provider!, signer!)
      // In a real scenario, this would call a MultiWalletLinker contract method for migration
      console.log(`Migrating identity from: ${migrationSourceWallet} to ${address}`)
      await new Promise((resolve) => setTimeout(resolve, 3000)) // Simulate blockchain tx

      setLinkedWallets((prev) =>
        prev.map((w) =>
          w.address === migrationSourceWallet
            ? { ...w, xpTransferred: 250 } // Simulate XP transfer
            : w,
        ),
      )
      toast({
        title: "Identity Migrated",
        description: `XP and SBTs from ${migrationSourceWallet} have been migrated to your current wallet.`,
      })
      setMigrationSourceWallet("")
    } catch (error) {
      console.error("Failed to migrate identity:", error)
      toast({
        title: "Error",
        description: "Failed to migrate identity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">MultiWallet & Identity Migration</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto mb-10">
        Link multiple wallets to consolidate your reputation and migrate your XP and Soulbound Tokens (SBTs) across
        them, ensuring your contributions are never lost.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <LinkIcon className="h-5 w-5" /> Link New Wallet
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Connect another wallet address to your primary profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLinkWallet} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-wallet-address" className="text-muted-foreground">
                  Wallet Address to Link
                </Label>
                <Input
                  id="new-wallet-address"
                  type="text"
                  placeholder="0x..."
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  className="input-cyber"
                  required
                />
              </div>
              <Button type="submit" disabled={isLinking || !isConnected} className="btn-cyber-primary w-full">
                {isLinking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Linking Wallet...
                  </>
                ) : (
                  "Link Wallet"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <ArrowRight className="h-5 w-5" /> Migrate Identity
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Transfer XP and SBTs from a linked wallet to your current active wallet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMigrateIdentity} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="source-wallet" className="text-muted-foreground">
                  Source Wallet for Migration
                </Label>
                <select
                  id="source-wallet"
                  value={migrationSourceWallet}
                  onChange={(e) => setMigrationSourceWallet(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                  required
                >
                  <option value="">-- Select a linked wallet --</option>
                  {linkedWallets.map((wallet) => (
                    <option key={wallet.address} value={wallet.address}>
                      {wallet.address}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                disabled={isMigrating || !isConnected || !migrationSourceWallet}
                className="btn-cyber-primary w-full"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Migrating Identity...
                  </>
                ) : (
                  "Migrate Identity"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="card-cyber mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Your Linked Wallets
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Overview of wallets connected to your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkedWallets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No wallets linked yet.</div>
          ) : (
            linkedWallets.map((wallet) => (
              <div
                key={wallet.address}
                className="p-4 border border-gray-700 rounded-md bg-gray-900/30 flex items-center justify-between"
              >
                <div>
                  <p className="font-mono text-white">{wallet.address}</p>
                  <p className="text-sm text-muted-foreground">Linked on: {wallet.linkedDate}</p>
                </div>
                {wallet.xpTransferred > 0 && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">{wallet.xpTransferred} XP Migrated</span>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { Vault, DollarSign, Lock, Unlock, ArrowUpRight, ArrowDownLeft, History, Shield } from "lucide-react"

interface VaultTransaction {
  id: string
  type: "deposit" | "withdraw" | "escrow_lock" | "escrow_release"
  amount: string
  timestamp: string
  status: "pending" | "completed" | "failed"
  bountyId?: string
}

export default function DepositVaultPage() {
  const { address, isConnected, provider, signer } = useWallet()
  const { toast } = useToast()
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [vaultBalance, setVaultBalance] = useState("0")
  const [escrowBalance, setEscrowBalance] = useState("0")
  const [transactions, setTransactions] = useState<VaultTransaction[]>([])

  useEffect(() => {
    if (isConnected && address) {
      fetchVaultData()
    }
  }, [isConnected, address])

  const fetchVaultData = async () => {
    try {
      // Mock data - in real implementation, fetch from smart contract
      setVaultBalance("1250.50")
      setEscrowBalance("750.25")
      setTransactions([
        {
          id: "tx-1",
          type: "deposit",
          amount: "500.00",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: "completed",
        },
        {
          id: "tx-2",
          type: "escrow_lock",
          amount: "250.00",
          timestamp: new Date(Date.now() - 43200000).toISOString(),
          status: "completed",
          bountyId: "bounty-123",
        },
        {
          id: "tx-3",
          type: "withdraw",
          amount: "100.00",
          timestamp: new Date(Date.now() - 21600000).toISOString(),
          status: "pending",
        },
      ])
    } catch (error) {
      console.error("Failed to fetch vault data:", error)
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount || !isConnected || !signer) {
      toast({
        title: "Error",
        description: "Please enter amount and connect wallet",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Mock deposit transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const newBalance = (Number.parseFloat(vaultBalance) + Number.parseFloat(depositAmount)).toString()
      setVaultBalance(newBalance)

      const newTransaction: VaultTransaction = {
        id: `tx-${Date.now()}`,
        type: "deposit",
        amount: depositAmount,
        timestamp: new Date().toISOString(),
        status: "completed",
      }
      setTransactions((prev) => [newTransaction, ...prev])

      toast({
        title: "Deposit Successful",
        description: `Deposited ${depositAmount} BTY to vault`,
      })
      setDepositAmount("")
    } catch (error) {
      toast({
        title: "Deposit Failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || !isConnected || !signer) {
      toast({
        title: "Error",
        description: "Please enter amount and connect wallet",
        variant: "destructive",
      })
      return
    }

    if (Number.parseFloat(withdrawAmount) > Number.parseFloat(vaultBalance)) {
      toast({
        title: "Insufficient Balance",
        description: "Cannot withdraw more than available balance",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Mock withdraw transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const newBalance = (Number.parseFloat(vaultBalance) - Number.parseFloat(withdrawAmount)).toString()
      setVaultBalance(newBalance)

      const newTransaction: VaultTransaction = {
        id: `tx-${Date.now()}`,
        type: "withdraw",
        amount: withdrawAmount,
        timestamp: new Date().toISOString(),
        status: "completed",
      }
      setTransactions((prev) => [newTransaction, ...prev])

      toast({
        title: "Withdrawal Successful",
        description: `Withdrew ${withdrawAmount} BTY from vault`,
      })
      setWithdrawAmount("")
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case "withdraw":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case "escrow_lock":
        return <Lock className="h-4 w-4 text-yellow-500" />
      case "escrow_release":
        return <Unlock className="h-4 w-4 text-blue-500" />
      default:
        return <History className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <Vault className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground text-center">Please connect your wallet to access the deposit vault</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <Vault className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Deposit & Escrow Vault</h1>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{vaultBalance} BTY</div>
            <p className="text-xs text-muted-foreground">Ready for bounty creation</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escrowed Funds</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{escrowBalance} BTY</div>
            <p className="text-xs text-muted-foreground">Locked in active bounties</p>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyber-glow">
              {(Number.parseFloat(vaultBalance) + Number.parseFloat(escrowBalance)).toFixed(2)} BTY
            </div>
            <p className="text-xs text-muted-foreground">Combined vault value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit/Withdraw */}
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle>Manage Funds</CardTitle>
            <CardDescription>Deposit or withdraw BTY tokens from your vault</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Amount (BTY)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="input-cyber"
                  />
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={isLoading || !depositAmount}
                  className="w-full btn-cyber-primary"
                >
                  {isLoading ? "Processing..." : "Deposit BTY"}
                </Button>
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount (BTY)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="input-cyber"
                  />
                  <p className="text-xs text-muted-foreground">Available: {vaultBalance} BTY</p>
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={isLoading || !withdrawAmount}
                  className="w-full btn-cyber-secondary"
                >
                  {isLoading ? "Processing..." : "Withdraw BTY"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent vault transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No transactions yet</p>
              ) : (
                transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border border-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(tx.type)}
                      <div>
                        <p className="font-medium capitalize">{tx.type.replace("_", " ")}</p>
                        <p className="text-sm text-muted-foreground">{new Date(tx.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{tx.amount} BTY</p>
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

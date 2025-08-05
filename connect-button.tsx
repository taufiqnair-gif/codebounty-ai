"use client"

import { Button } from "@/components/ui/button"
import { useWallet } from "@/hooks/use-wallet"
import { Loader2 } from "lucide-react"

export function ConnectButton() {
  const { address, isConnected, connect, disconnect, isLoading } = useWallet()

  if (isLoading) {
    return (
      <Button disabled className="btn-cyber">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {address.substring(0, 6)}...{address.substring(address.length - 4)}
        </span>
        <Button onClick={disconnect} className="btn-cyber-secondary">
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={connect} className="btn-cyber-primary">
      Connect Wallet
    </Button>
  )
}

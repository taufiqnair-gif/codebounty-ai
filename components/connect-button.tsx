"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWallet } from "@/hooks/use-wallet"
import { Wallet, Copy, ExternalLink, LogOut, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export function ConnectButton() {
  const { address, isConnected, isConnecting, connect, disconnect, balance } = useWallet()
  const { toast } = useToast()

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnecting) {
    return (
      <Button disabled className="btn-cyber-primary">
        <Wallet className="h-4 w-4 mr-2 animate-pulse" />
        Connecting...
      </Button>
    )
  }

  if (!isConnected) {
    return (
      <Button onClick={connect} className="btn-cyber-primary">
        <Wallet className="h-4 w-4 mr-2" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="btn-cyber-secondary bg-transparent">
          <Wallet className="h-4 w-4 mr-2" />
          {formatAddress(address!)}
          <Badge variant="secondary" className="ml-2">
            {balance} ETH
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Connected Wallet</p>
            <p className="text-xs text-muted-foreground font-mono">{address}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Address
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Etherscan
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={disconnect} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

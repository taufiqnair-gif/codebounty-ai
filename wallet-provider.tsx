"use client"

import { createContext, useEffect, useState, type ReactNode } from "react"
import { useWallet } from "@/hooks/use-wallet"

interface WalletContextType {
  address: string | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

export const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: async () => {},
})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if wallet was previously connected
    const savedAddress = localStorage.getItem("walletAddress")
    if (savedAddress) {
      setAddress(savedAddress)
      setIsConnected(true)
    }
  }, [])

  const connect = async () => {
    if (!mounted) return

    // Mock wallet connection for demo
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const mockAddress = "0x" + Math.random().toString(16).slice(2, 12).padEnd(40, "0")
        setAddress(mockAddress)
        setIsConnected(true)
        localStorage.setItem("walletAddress", mockAddress)
        resolve()
      }, 1000)
    })
  }

  const disconnect = async () => {
    if (!mounted) return

    return new Promise<void>((resolve) => {
      setAddress(null)
      setIsConnected(false)
      localStorage.removeItem("walletAddress")
      resolve()
    })
  }

  // The useWallet hook already handles the connection logic and state.
  // We just need to ensure it's initialized when the provider mounts.
  useWallet()

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <WalletContext.Provider value={{ address, isConnected, connect, disconnect }}>{children}</WalletContext.Provider>
  )
}

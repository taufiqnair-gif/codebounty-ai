"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { ethers } from "ethers"

interface WalletContextType {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  balance: string
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [balance, setBalance] = useState("0.00")
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask!")
      return
    }

    setIsConnecting(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])

      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const balance = await provider.getBalance(address)

      setProvider(provider)
      setSigner(signer)
      setAddress(address)
      setBalance(Number.parseFloat(ethers.formatEther(balance)).toFixed(4))
      setIsConnected(true)

      // Store connection state
      localStorage.setItem("walletConnected", "true")
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setIsConnected(false)
    setBalance("0.00")
    setProvider(null)
    setSigner(null)
    localStorage.removeItem("walletConnected")
  }

  const updateBalance = async () => {
    if (provider && address) {
      try {
        const balance = await provider.getBalance(address)
        setBalance(Number.parseFloat(ethers.formatEther(balance)).toFixed(4))
      } catch (error) {
        console.error("Failed to update balance:", error)
      }
    }
  }

  useEffect(() => {
    // Auto-connect if previously connected
    const wasConnected = localStorage.getItem("walletConnected")
    if (wasConnected === "true" && window.ethereum) {
      connect()
    }

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          connect()
        }
      })

      window.ethereum.on("chainChanged", () => {
        window.location.reload()
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
        window.ethereum.removeAllListeners("chainChanged")
      }
    }
  }, [])

  useEffect(() => {
    if (isConnected) {
      updateBalance()
      const interval = setInterval(updateBalance, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isConnected, address, provider])

  const value: WalletContextType = {
    address,
    isConnected,
    isConnecting,
    balance,
    provider,
    signer,
    connect,
    disconnect,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

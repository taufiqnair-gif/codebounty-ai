"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"

interface WalletState {
  address: string | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  signer: ethers.Signer | null
  provider: ethers.BrowserProvider | null
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)

  const connect = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (typeof window.ethereum !== "undefined") {
        const browserProvider = new ethers.BrowserProvider(window.ethereum)
        setProvider(browserProvider)

        const accounts = await browserProvider.send("eth_requestAccounts", [])
        const connectedAddress = accounts[0]
        setAddress(connectedAddress)
        setIsConnected(true)

        const walletSigner = await browserProvider.getSigner()
        setSigner(walletSigner)

        console.log("Wallet connected:", connectedAddress)
      } else {
        setError("MetaMask or a compatible wallet is not installed.")
        console.error("MetaMask or a compatible wallet is not installed.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet.")
      console.error("Failed to connect wallet:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setIsConnected(false)
    setSigner(null)
    setProvider(null)
    setError(null)
    console.log("Wallet disconnected.")
  }, [])

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true)
      if (typeof window.ethereum !== "undefined") {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum)
          setProvider(browserProvider)
          const accounts = await browserProvider.listAccounts()
          if (accounts.length > 0) {
            const connectedAddress = accounts[0].address
            setAddress(connectedAddress)
            setIsConnected(true)
            const walletSigner = await browserProvider.getSigner()
            setSigner(walletSigner)
            console.log("Wallet already connected:", connectedAddress)
          } else {
            setIsConnected(false)
          }

          window.ethereum.on("accountsChanged", (newAccounts: string[]) => {
            if (newAccounts.length > 0) {
              setAddress(newAccounts[0])
              setIsConnected(true)
              browserProvider.getSigner().then(setSigner)
              console.log("Accounts changed to:", newAccounts[0])
            } else {
              disconnect()
            }
          })

          window.ethereum.on("chainChanged", (chainId: string) => {
            console.log("Chain changed to:", chainId)
            // Optional: Reload or re-initialize provider/signer if chain change affects contract interactions
            // For simplicity, we'll just log for now.
          })

          window.ethereum.on("disconnect", (error: any) => {
            console.log("Wallet disconnected from DApp:", error)
            disconnect()
          })
        } catch (err: any) {
          setError(err.message || "Error checking wallet connection.")
          console.error("Error checking wallet connection:", err)
        }
      }
      setIsLoading(false)
    }

    checkConnection()

    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener("accountsChanged", () => {})
        window.ethereum.removeListener("chainChanged", () => {})
        window.ethereum.removeListener("disconnect", () => {})
      }
    }
  }, [disconnect])

  return { address, isConnected, isLoading, error, connect, disconnect, signer, provider }
}

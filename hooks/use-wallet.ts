"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"

interface WalletState {
  address: string | null
  isConnected: boolean
  loading: boolean
  connect: () => Promise<void>
  disconnect: () => void
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)

  useEffect(() => {
    const initWallet = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum)
          setProvider(browserProvider)

          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            const currentAddress = accounts[0]
            setAddress(currentAddress)
            setIsConnected(true)
            setSigner(await browserProvider.getSigner())
          }
        } catch (error) {
          console.error("Error initializing wallet:", error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    initWallet()

    // Event listeners for account and chain changes
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          if (provider) {
            provider.getSigner().then(setSigner)
          }
        } else {
          setAddress(null)
          setIsConnected(false)
          setSigner(null)
        }
      })

      window.ethereum.on("chainChanged", (chainId: string) => {
        console.log("Chain changed to:", chainId)
        // You might want to reload the page or re-initialize provider/signer here
        if (provider) {
          provider.getSigner().then(setSigner)
        }
      })
    }

    return () => {
      // Clean up event listeners
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener("accountsChanged", () => {})
        window.ethereum.removeListener("chainChanged", () => {})
      }
    }
  }, [provider]) // Depend on provider to re-attach signer if provider changes

  const connect = async () => {
    setLoading(true)
    try {
      if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed. Please install it to connect your wallet.")
        return
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      if (accounts.length > 0) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum)
        setProvider(browserProvider)
        setAddress(accounts[0])
        setIsConnected(true)
        setSigner(await browserProvider.getSigner())
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error)
      setIsConnected(false)
      setAddress(null)
      setSigner(null)
    } finally {
      setLoading(false)
    }
  }

  const disconnect = () => {
    // For MetaMask, there's no direct "disconnect" method from the dapp side
    // The user has to disconnect manually from MetaMask.
    // We just clear our internal state.
    setAddress(null)
    setIsConnected(false)
    setSigner(null)
    setProvider(null)
    console.log("Wallet disconnected (frontend state cleared).")
  }

  return { address, isConnected, loading, connect, disconnect, provider, signer }
}

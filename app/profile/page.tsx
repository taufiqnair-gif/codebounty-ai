"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OwnerConfigPanel } from "@/components/owner-config-panel"
import { HunterConfigPanel } from "@/components/hunter-config-panel"
import { useWallet } from "@/hooks/use-wallet"
import { Loader2, User } from "lucide-react"
import { ContractService } from "@/lib/contract-service"

export default function ProfilePage() {
  const { address, isConnected, loading: walletLoading, provider } = useWallet()
  const [userRole, setUserRole] = useState<"hunter" | "owner">("hunter") // Default role
  const [isLoadingRole, setIsLoadingRole] = useState(true)

  useEffect(() => {
    const checkRole = async () => {
      if (isConnected && address && provider) {
        try {
          const contractService = new ContractService(provider, await provider.getSigner())
          const ownerAddress = await contractService.getAutoBountyManagerOwner()
          if (address.toLowerCase() === ownerAddress.toLowerCase()) {
            setUserRole("owner")
          } else {
            setUserRole("hunter")
          }
        } catch (error) {
          console.error("Failed to check owner role:", error)
          setUserRole("hunter") // Default to hunter if role check fails
        }
      } else {
        setUserRole("hunter")
      }
      setIsLoadingRole(false)
    }
    checkRole()
  }, [isConnected, address, provider])

  if (walletLoading || isLoadingRole) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">Loading profile...</span>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-muted-foreground">
        <User className="h-16 w-16 mb-4" />
        <p className="text-lg mb-2">Wallet Not Connected</p>
        <p className="text-center">Please connect your wallet to view and manage your profile settings.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">User Profile</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto mb-10">
        Manage your preferences and configurations as a bounty hunter or contract owner.
      </p>

      <Card className="card-cyber max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary flex items-center gap-2">
            <User className="h-6 w-6" /> Your Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Select your role to configure specific settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={userRole} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
              <TabsTrigger value="hunter" onClick={() => setUserRole("hunter")}>
                Hunter Settings
              </TabsTrigger>
              <TabsTrigger value="owner" onClick={() => setUserRole("owner")}>
                Owner Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="hunter" className="mt-6">
              <HunterConfigPanel />
            </TabsContent>
            <TabsContent value="owner" className="mt-6">
              <OwnerConfigPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

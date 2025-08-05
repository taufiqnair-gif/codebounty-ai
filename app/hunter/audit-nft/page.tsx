"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Award, FileText, Star } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { ContractService } from "@/lib/contract-service"
import { useToast } from "@/hooks/use-toast"

interface AuditNFT {
  tokenId: string
  auditId: string
  bountyId: string
  qualityScore: number
  evidenceCid: string
  timestamp: string
  tokenURI: string
}

export default function AuditNFTPage() {
  const [nfts, setNfts] = useState<AuditNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isConnected, address, provider } = useWallet()
  const { toast } = useToast()

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!isConnected || !address || !provider) {
        setLoading(false)
        setError("Please connect your wallet to view your Audit NFTs.")
        return
      }
      setLoading(true)
      setError(null)
      try {
        const contractService = new ContractService(provider, await provider.getSigner())
        const fetchedNFTs = await contractService.getHunterNFTs(address)
        setNfts(fetchedNFTs)
      } catch (err) {
        console.error("Failed to fetch Audit NFTs:", err)
        setError("Failed to load Audit NFTs. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchNFTs()
  }, [isConnected, address, provider])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="sr-only">Loading Audit NFTs...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-destructive">
        <p className="text-lg">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-cyber-glow mb-8">Your Audit NFTs</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto mb-10">
        These Soulbound Tokens (SBTs) represent your proven expertise and contributions to smart contract security. They
        are non-transferable and build your on-chain reputation.
      </p>

      {!isConnected || !address ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-4 text-muted-foreground">
          <Award className="h-16 w-16 mb-4" />
          <p className="text-lg mb-2">Wallet Not Connected</p>
          <p className="text-center">Connect your wallet to see your earned Audit NFTs.</p>
        </div>
      ) : nfts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-4 text-muted-foreground">
          <Award className="h-16 w-16 mb-4" />
          <p className="text-lg mb-2">No Audit NFTs Found</p>
          <p className="text-center">
            You haven't earned any Audit NFTs yet. Participate in bounties and submit high-quality fixes to earn them!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <Card key={nft.tokenId} className="card-cyber">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                  <Award className="h-6 w-6 text-purple-400" /> Audit NFT #{nft.tokenId}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Proof of contribution for Audit ID: {nft.auditId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Bounty ID:</span>
                  <span className="text-white">{nft.bountyId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quality Score:</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-white font-medium">{nft.qualityScore}/100</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Issued On:</span>
                  <span className="text-white">{new Date(nft.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Evidence CID:</span>
                  <a
                    href={`https://ipfs.io/ipfs/${nft.evidenceCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm truncate max-w-[150px]"
                  >
                    {nft.evidenceCid.slice(0, 10)}...{nft.evidenceCid.slice(-4)}
                  </a>
                </div>
                <Button
                  variant="outline"
                  className="w-full btn-cyber-secondary mt-4 bg-transparent"
                  onClick={() => window.open(nft.tokenURI, "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" /> View Metadata
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

import { ethers } from "ethers"
import { getContract } from "./contracts"
import type { Bounty } from "@/types/bounty"

export class ContractService {
  private provider: ethers.Provider
  private signer: ethers.Signer
  private autoBountyManager: ethers.Contract
  private bountyToken: ethers.Contract
  private auditRegistry: ethers.Contract
  private auditEngine: ethers.Contract
  private auditNFT: ethers.Contract

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider
    this.signer = signer
    this.autoBountyManager = getContract("AutoBountyManager", signer)
    this.bountyToken = getContract("BountyToken", signer)
    this.auditRegistry = getContract("AuditRegistry", signer)
    this.auditEngine = getContract("AuditEngine", signer)
    this.auditNFT = getContract("AuditNFT", signer)
  }

  // Owner Flow: Create bounties for specific issues
  async createBountyOnChain(
    auditId: number,
    issueIds: string[],
    rewardAmounts: number[], // in ETH
  ): Promise<string> {
    try {
      console.log(`💰 Creating ${issueIds.length} bounties for audit ${auditId}...`)

      // Convert ETH amounts to Wei
      const rewardAmountsWei = rewardAmounts.map((amount) => ethers.parseEther(amount.toString()))

      // Calculate total reward needed
      const totalReward = rewardAmountsWei.reduce((sum, amount) => sum + amount, 0n)
      console.log(`💸 Total reward needed: ${ethers.formatEther(totalReward)} BTY`)

      // Check current allowance
      const currentAllowance = await this.bountyToken.allowance(
        await this.signer.getAddress(),
        await this.autoBountyManager.getAddress(),
      )

      // Approve additional tokens if needed
      if (currentAllowance < totalReward) {
        const additionalApproval = totalReward - currentAllowance
        console.log(`🔓 Approving additional ${ethers.formatEther(additionalApproval)} BTY...`)

        const approveTx = await this.bountyToken.approve(await this.autoBountyManager.getAddress(), totalReward)
        await approveTx.wait()
        console.log(`✅ Approval successful: ${approveTx.hash}`)
      }

      // Create the bounties
      const tx = await this.autoBountyManager.createBounties(auditId, issueIds, rewardAmountsWei)
      const receipt = await tx.wait()

      console.log(`🎯 Bounties created successfully: ${tx.hash}`)

      // Log BountyCreated events
      const bountyCreatedEvents = receipt.logs.filter((log: any) => {
        try {
          const parsed = this.autoBountyManager.interface.parseLog(log)
          return parsed?.name === "BountyCreated"
        } catch {
          return false
        }
      })

      console.log(`📋 Created ${bountyCreatedEvents.length} bounties:`)
      bountyCreatedEvents.forEach((event: any, index: number) => {
        const parsed = this.autoBountyManager.interface.parseLog(event)
        console.log(`  ${index + 1}. Bounty ID: ${parsed?.args.bountyId}, Issue: ${parsed?.args.issueId}`)
      })

      return tx.hash
    } catch (error) {
      console.error("❌ Error creating bounties on chain:", error)
      throw error
    }
  }

  // Hunter Flow: Submit solution to bounty
  async submitSolutionOnChain(bountyId: number, reportHash: string): Promise<string> {
    try {
      console.log(`📤 Submitting solution to bounty ${bountyId}...`)

      const tx = await this.autoBountyManager.submitSolution(bountyId, reportHash)
      const receipt = await tx.wait()

      console.log(`✅ Solution submitted successfully: ${tx.hash}`)
      return tx.hash
    } catch (error) {
      console.error("❌ Error submitting solution on chain:", error)
      throw error
    }
  }

  // Owner Flow: Resolve bounty and pay winner
  async resolveBountyOnChain(bountyId: number, winnerAddress: string, evidenceCid: string): Promise<string> {
    try {
      console.log(`🏆 Resolving bounty ${bountyId} with winner ${winnerAddress}...`)

      const tx = await this.autoBountyManager.resolveBounty(bountyId, winnerAddress, evidenceCid)
      const receipt = await tx.wait()

      console.log(`✅ Bounty resolved successfully: ${tx.hash}`)

      // Log BountyResolved event
      const bountyResolvedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.autoBountyManager.interface.parseLog(log)
          return parsed?.name === "BountyResolved"
        } catch {
          return false
        }
      })

      if (bountyResolvedEvent) {
        const parsed = this.autoBountyManager.interface.parseLog(bountyResolvedEvent)
        console.log(`💰 Reward paid: ${ethers.formatEther(parsed?.args.rewardAmount)} BTY`)
        console.log(`🏅 Quality score: ${parsed?.args.qualityScore}/100`)
      }

      return tx.hash
    } catch (error) {
      console.error("❌ Error resolving bounty on chain:", error)
      throw error
    }
  }

  // Close bounty without winner (refund)
  async closeBountyOnChain(bountyId: number): Promise<string> {
    try {
      console.log(`🔒 Closing bounty ${bountyId}...`)

      const tx = await this.autoBountyManager.closeBounty(bountyId)
      const receipt = await tx.wait()

      console.log(`✅ Bounty closed successfully: ${tx.hash}`)
      return tx.hash
    } catch (error) {
      console.error("❌ Error closing bounty on chain:", error)
      throw error
    }
  }

  // Fetch on-chain bounty data
  async getOnChainBounty(bountyId: number): Promise<Bounty | null> {
    try {
      const bountyData = await this.autoBountyManager.bounties(bountyId)

      if (!bountyData.bountyId || bountyData.bountyId.toString() === "0") {
        return null
      }

      // Get audit details for more context
      let auditDetails = null
      try {
        auditDetails = await this.auditRegistry.getAudit(bountyData.auditId)
      } catch (error) {
        console.warn(`Could not fetch audit details for audit ${bountyData.auditId}`)
      }

      const bounty: Bounty = {
        id: `bounty-${bountyData.bountyId.toString()}`,
        title: `Security Fix: ${bountyData.issueId}`,
        description: auditDetails
          ? `Fix the security vulnerability "${bountyData.issueId}" identified in audit ${bountyData.auditId}. This issue was found during automated security analysis.`
          : `Fix the security vulnerability identified as "${bountyData.issueId}"`,
        reward: ethers.formatEther(bountyData.rewardAmount) + " BTY",
        status: bountyData.isActive ? "Open" : "Closed",
        dueDate: new Date(Number(bountyData.deadline) * 1000).toISOString(),
        postedBy: bountyData.poster,
        codeLink: auditDetails?.sourceCid
          ? `https://ipfs.io/ipfs/${auditDetails.sourceCid}`
          : `https://etherscan.io/address/${bountyData.poster}`,
        tags: ["on-chain", "security", bountyData.issueId.split("-")[0] || "vulnerability"],
        submissions: [], // Would need additional calls to fetch submissions
      }

      return bounty
    } catch (error) {
      console.error("❌ Error fetching on-chain bounty:", error)
      return null
    }
  }

  // Get hunter's reputation NFTs
  async getHunterNFTs(hunterAddress: string): Promise<any[]> {
    try {
      console.log(`🏅 Fetching NFTs for hunter ${hunterAddress}...`)

      const tokenIds = await this.auditNFT.getHunterNFTs(hunterAddress)
      console.log(`📋 Found ${tokenIds.length} NFTs`)

      const nfts = []
      for (const tokenId of tokenIds) {
        try {
          const metadata = await this.auditNFT.nftMetadata(tokenId)
          const tokenURI = await this.auditNFT.tokenURI(tokenId)

          nfts.push({
            tokenId: tokenId.toString(),
            auditId: metadata.auditId.toString(),
            bountyId: metadata.bountyId.toString(),
            qualityScore: metadata.qualityScore,
            evidenceCid: metadata.evidenceCid,
            timestamp: new Date(Number(metadata.timestamp) * 1000).toISOString(),
            tokenURI,
          })
        } catch (error) {
          console.error(`Error fetching metadata for token ${tokenId}:`, error)
        }
      }

      console.log(`✅ Successfully fetched ${nfts.length} NFT details`)
      return nfts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
      console.error("❌ Error fetching hunter NFTs:", error)
      return []
    }
  }

  // Trigger audit scan
  async triggerAuditScan(sourceCid: string): Promise<number> {
    try {
      console.log(`🔍 Triggering audit scan for source: ${sourceCid}...`)

      const tx = await this.auditEngine.scanContract(sourceCid)
      const receipt = await tx.wait()

      // Extract audit ID from AuditRequested event
      const auditRequestedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.auditEngine.interface.parseLog(log)
          return parsed?.name === "AuditRequested"
        } catch {
          return false
        }
      })

      if (!auditRequestedEvent) {
        throw new Error("AuditRequested event not found")
      }

      const parsed = this.auditEngine.interface.parseLog(auditRequestedEvent)
      const auditId = Number(parsed?.args.auditId)

      console.log(`✅ Audit scan triggered successfully: ${tx.hash}`)
      console.log(`📋 Audit ID: ${auditId}`)

      return auditId
    } catch (error) {
      console.error("❌ Error triggering audit scan:", error)
      throw error
    }
  }

  // Get contract parameters
  async getContractParameters(): Promise<{
    highRiskThreshold: number
    minQualityScore: number
    concurrencyLevel: number
  }> {
    try {
      const [highRiskThreshold, minQualityScore] = await Promise.all([
        this.auditRegistry.HIGH_RISK_THRESHOLD(),
        this.auditRegistry.MIN_QUALITY_SCORE(),
      ])

      // Note: CONCURRENCY_LEVEL would need to be exposed by AuditEngine
      const concurrencyLevel = 50 // Default value

      return {
        highRiskThreshold: Number(highRiskThreshold),
        minQualityScore: Number(minQualityScore),
        concurrencyLevel,
      }
    } catch (error) {
      console.error("❌ Error fetching contract parameters:", error)
      return {
        highRiskThreshold: 75,
        minQualityScore: 70,
        concurrencyLevel: 50,
      }
    }
  }

  // Get bounty statistics
  async getBountyStats(): Promise<{
    totalBounties: number
    activeBounties: number
    totalRewards: string
    averageReward: string
  }> {
    try {
      const activeBountyIds = await this.autoBountyManager.getActiveBounties()
      let totalRewards = 0n
      let totalBounties = 0

      for (const bountyId of activeBountyIds) {
        try {
          const bountyData = await this.autoBountyManager.bounties(bountyId)
          totalRewards += bountyData.rewardAmount
          totalBounties++
        } catch (error) {
          console.warn(`Could not fetch bounty ${bountyId}:`, error)
        }
      }

      const averageReward = totalBounties > 0 ? totalRewards / BigInt(totalBounties) : 0n

      return {
        totalBounties,
        activeBounties: activeBountyIds.length,
        totalRewards: ethers.formatEther(totalRewards),
        averageReward: ethers.formatEther(averageReward),
      }
    } catch (error) {
      console.error("❌ Error fetching bounty stats:", error)
      return {
        totalBounties: 0,
        activeBounties: 0,
        totalRewards: "0",
        averageReward: "0",
      }
    }
  }
}

// Legacy functions for backward compatibility
export async function createBountyOnChain(
  signer: ethers.JsonRpcSigner,
  auditId: number,
  rewardAmount: number,
  durationDays: number,
): Promise<string> {
  const service = new ContractService(signer.provider, signer)
  return service.createBountyOnChain(auditId, [`issue-${auditId}`], [rewardAmount])
}

export async function submitSolutionOnChain(
  signer: ethers.JsonRpcSigner,
  bountyId: number,
  reportHash: string,
): Promise<string> {
  const service = new ContractService(signer.provider, signer)
  return service.submitSolutionOnChain(bountyId, reportHash)
}

export async function resolveBountyOnChain(
  signer: ethers.JsonRpcSigner,
  bountyId: number,
  winnerAddress: string,
  reportHash: string,
): Promise<string> {
  const service = new ContractService(signer.provider, signer)
  return service.resolveBountyOnChain(bountyId, winnerAddress, reportHash)
}

export async function closeBountyOnChain(signer: ethers.JsonRpcSigner, bountyId: number): Promise<string> {
  const service = new ContractService(signer.provider, signer)
  return service.closeBountyOnChain(bountyId)
}

export async function getOnChainBounty(provider: ethers.BrowserProvider, bountyId: number): Promise<Bounty | null> {
  const signer = await provider.getSigner()
  const service = new ContractService(provider, signer)
  return service.getOnChainBounty(bountyId)
}

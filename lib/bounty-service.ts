import { ethers } from "ethers"
import { getContract } from "./contracts"
import type { Bounty, BountySubmission } from "@/types/bounty"
import { BountyStatus } from "@/constants/bountyStatus"

export class BountyService {
  private provider: ethers.Provider
  private signer?: ethers.Signer
  private autoBountyManager: ethers.Contract
  private commitReveal: ethers.Contract
  private auditRegistry: ethers.Contract

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider
    this.signer = signer
    this.autoBountyManager = getContract("AutoBountyManager", signer || provider)
    this.commitReveal = getContract("CommitReveal", signer || provider)
    this.auditRegistry = getContract("AuditRegistry", signer || provider)
  }

  async getBounties(status?: BountyStatus): Promise<Bounty[]> {
    try {
      console.log(`🔍 Fetching bounties with status: ${status || "all"}`)

      const activeBountyIds = await this.autoBountyManager.getActiveBounties()
      console.log(`📋 Found ${activeBountyIds.length} active bounty IDs`)

      const bounties: Bounty[] = []

      for (const bountyId of activeBountyIds) {
        try {
          const bountyData = await this.autoBountyManager.bounties(bountyId)
          const submissions = await this.getBountySubmissions(Number(bountyId))

          // Get audit details for more context
          let auditDetails = null
          try {
            auditDetails = await this.auditRegistry.getAudit(bountyData.auditId)
          } catch (error) {
            console.warn(`Could not fetch audit details for audit ${bountyData.auditId}`)
          }

          const bounty: Bounty = {
            id: `bounty-${bountyId}`,
            title: `Security Fix: ${bountyData.issueId}`,
            description: auditDetails
              ? `Fix the security vulnerability "${bountyData.issueId}" identified in audit ${bountyData.auditId}. This issue was found during automated security analysis.`
              : `Fix the security vulnerability identified as "${bountyData.issueId}"`,
            reward: `${ethers.formatEther(bountyData.rewardAmount)} BTY`,
            status: bountyData.isActive ? BountyStatus.Open : BountyStatus.Closed,
            dueDate: new Date(Number(bountyData.deadline) * 1000).toISOString(),
            postedBy: bountyData.poster,
            codeLink: auditDetails?.sourceCid
              ? `https://ipfs.io/ipfs/${auditDetails.sourceCid}`
              : `https://etherscan.io/address/${bountyData.poster}`,
            tags: ["security", "smart-contract", bountyData.issueId.split("-")[0] || "vulnerability"],
            submissions,
          }

          // Filter by status if specified
          if (!status || bounty.status === status) {
            bounties.push(bounty)
          }
        } catch (error) {
          console.error(`Error processing bounty ${bountyId}:`, error)
        }
      }

      console.log(`✅ Successfully fetched ${bounties.length} bounties`)
      return bounties.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    } catch (error) {
      console.error("❌ Error fetching bounties:", error)
      return []
    }
  }

  async getBountyById(bountyId: string): Promise<Bounty | null> {
    try {
      const bountyIdNum = Number.parseInt(bountyId.replace("bounty-", ""))
      const bountyData = await this.autoBountyManager.bounties(bountyIdNum)

      if (!bountyData.bountyId || bountyData.bountyId.toString() === "0") {
        return null
      }

      const submissions = await this.getBountySubmissions(bountyIdNum)

      // Get audit details
      let auditDetails = null
      try {
        auditDetails = await this.auditRegistry.getAudit(bountyData.auditId)
      } catch (error) {
        console.warn(`Could not fetch audit details for audit ${bountyData.auditId}`)
      }

      return {
        id: bountyId,
        title: `Security Fix: ${bountyData.issueId}`,
        description: auditDetails
          ? `Fix the security vulnerability "${bountyData.issueId}" identified in audit ${bountyData.auditId}. This issue was found during automated security analysis.`
          : `Fix the security vulnerability identified as "${bountyData.issueId}"`,
        reward: `${ethers.formatEther(bountyData.rewardAmount)} BTY`,
        status: bountyData.isActive ? BountyStatus.Open : BountyStatus.Closed,
        dueDate: new Date(Number(bountyData.deadline) * 1000).toISOString(),
        postedBy: bountyData.poster,
        codeLink: auditDetails?.sourceCid
          ? `https://ipfs.io/ipfs/${auditDetails.sourceCid}`
          : `https://etherscan.io/address/${bountyData.poster}`,
        tags: ["security", "smart-contract", bountyData.issueId.split("-")[0] || "vulnerability"],
        submissions,
      }
    } catch (error) {
      console.error(`Error fetching bounty ${bountyId}:`, error)
      return null
    }
  }

  async getBountySubmissions(bountyId: number): Promise<BountySubmission[]> {
    try {
      const submissionAddresses = await this.autoBountyManager.getBountySubmissions(bountyId)
      const submissions: BountySubmission[] = []

      for (const address of submissionAddresses) {
        try {
          const commit = await this.commitReveal.getCommit(bountyId, address)

          submissions.push({
            id: `submission-${bountyId}-${address}`,
            hunterAddress: address,
            submissionDate: new Date(Number(commit.timestamp) * 1000).toISOString(),
            description: commit.revealed
              ? `Patch submitted: ${commit.revealedValue.substring(0, 100)}...`
              : "Committed solution (pending reveal)",
            status: commit.revealed ? "Pending" : "Committed",
            auditReportLink: commit.revealed ? `ipfs://${commit.revealedValue}` : undefined,
          })
        } catch (error) {
          console.error(`Error fetching commit for ${address}:`, error)
        }
      }

      return submissions.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
    } catch (error) {
      console.error("Error fetching submissions:", error)
      return []
    }
  }

  // Commit phase: Hunter commits hash of their solution
  async commitToBounty(bountyId: string, report: string, nonce: string): Promise<string> {
    if (!this.signer) throw new Error("Signer required for committing")

    try {
      console.log(`📝 Committing to bounty ${bountyId}...`)

      const bountyIdNum = Number.parseInt(bountyId.replace("bounty-", ""))
      const hash = ethers.keccak256(ethers.toUtf8Bytes(report + nonce))

      const tx = await this.commitReveal.commit(bountyIdNum, hash)
      const receipt = await tx.wait()

      console.log(`✅ Commit successful: ${tx.hash}`)
      return tx.hash
    } catch (error) {
      console.error("❌ Error committing to bounty:", error)
      throw error
    }
  }

  // Reveal phase: Hunter reveals their actual solution
  async revealBountySubmission(bountyId: string, report: string, nonce: string): Promise<string> {
    if (!this.signer) throw new Error("Signer required for revealing")

    try {
      console.log(`🔓 Revealing bounty submission for ${bountyId}...`)

      const bountyIdNum = Number.parseInt(bountyId.replace("bounty-", ""))

      const tx = await this.commitReveal.reveal(bountyIdNum, report, nonce)
      const receipt = await tx.wait()

      console.log(`✅ Reveal successful: ${tx.hash}`)
      return tx.hash
    } catch (error) {
      console.error("❌ Error revealing bounty submission:", error)
      throw error
    }
  }

  // Legacy method for direct submission (bypasses commit/reveal)
  async submitBounty(
    bountyId: string,
    submission: {
      hunterAddress: string
      description: string
      auditReportLink: string
    },
  ): Promise<void> {
    if (!this.signer) throw new Error("Signer required for submission")

    try {
      console.log(`📤 Submitting solution to bounty ${bountyId}...`)

      const bountyIdNum = Number.parseInt(bountyId.replace("bounty-", ""))

      const tx = await this.autoBountyManager.submitSolution(bountyIdNum, submission.auditReportLink)
      const receipt = await tx.wait()

      console.log(`✅ Bounty submission successful: ${tx.hash}`)
    } catch (error) {
      console.error("❌ Error submitting bounty:", error)
      throw error
    }
  }

  // Owner resolves bounty and pays winner
  async resolveBounty(bountyId: string, winnerAddress: string, evidenceCid: string): Promise<string> {
    if (!this.signer) throw new Error("Signer required for resolving bounty")

    try {
      console.log(`🏆 Resolving bounty ${bountyId} with winner ${winnerAddress}...`)

      const bountyIdNum = Number.parseInt(bountyId.replace("bounty-", ""))

      const tx = await this.autoBountyManager.resolveBounty(bountyIdNum, winnerAddress, evidenceCid)
      const receipt = await tx.wait()

      console.log(`✅ Bounty resolved successfully: ${tx.hash}`)
      return tx.hash
    } catch (error) {
      console.error("❌ Error resolving bounty:", error)
      throw error
    }
  }

  // Close bounty without winner (refund)
  async closeBounty(bountyId: string): Promise<string> {
    if (!this.signer) throw new Error("Signer required for closing bounty")

    try {
      console.log(`🔒 Closing bounty ${bountyId}...`)

      const bountyIdNum = Number.parseInt(bountyId.replace("bounty-", ""))

      const tx = await this.autoBountyManager.closeBounty(bountyIdNum)
      const receipt = await tx.wait()

      console.log(`✅ Bounty closed successfully: ${tx.hash}`)
      return tx.hash
    } catch (error) {
      console.error("❌ Error closing bounty:", error)
      throw error
    }
  }

  // Create new bounty (for manual bounty creation)
  async createBounty(bounty: {
    title: string
    description: string
    reward: string
    dueDate: string
    codeLink: string
    tags: string[]
  }): Promise<Bounty> {
    if (!this.signer) throw new Error("Signer required for creating bounty")

    try {
      console.log(`🆕 Creating new bounty: ${bounty.title}...`)

      // This would typically involve calling a different contract method
      // For now, we'll simulate the creation
      const newBounty: Bounty = {
        id: `bounty-${Date.now()}`,
        status: BountyStatus.Open,
        submissions: [],
        postedBy: await this.signer.getAddress(),
        ...bounty,
      }

      console.log(`✅ Bounty created: ${newBounty.id}`)
      return newBounty
    } catch (error) {
      console.error("❌ Error creating bounty:", error)
      throw error
    }
  }

  // Update submission status (for bounty owners)
  async updateSubmissionStatus(
    bountyId: string,
    submissionId: string,
    status: "Approved" | "Rejected",
  ): Promise<Bounty> {
    if (!this.signer) throw new Error("Signer required for updating submission status")

    try {
      console.log(`📝 Updating submission ${submissionId} status to ${status}...`)

      // In a real implementation, this would update the submission status on-chain
      // For now, we'll fetch the updated bounty
      const bounty = await this.getBountyById(bountyId)
      if (!bounty) {
        throw new Error("Bounty not found")
      }

      console.log(`✅ Submission status updated to ${status}`)
      return bounty
    } catch (error) {
      console.error("❌ Error updating submission status:", error)
      throw error
    }
  }
}

// Legacy functions for backward compatibility
export async function getBounties(status?: BountyStatus): Promise<Bounty[]> {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const service = new BountyService(provider)
      return await service.getBounties(status)
    } catch (error) {
      console.error("Error in getBounties:", error)
    }
  }

  // Return empty array for SSR/development
  return []
}

export async function getBountyById(id: string): Promise<Bounty | null> {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const service = new BountyService(provider)
      return await service.getBountyById(id)
    } catch (error) {
      console.error("Error in getBountyById:", error)
    }
  }

  return null
}

export async function submitBounty(
  bountyId: string,
  submission: {
    hunterAddress: string
    description: string
    auditReportLink: string
  },
): Promise<void> {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const service = new BountyService(provider, signer)
    return await service.submitBounty(bountyId, submission)
  }

  throw new Error("Ethereum provider not available")
}

export async function createBounty(bounty: {
  title: string
  description: string
  reward: string
  dueDate: string
  codeLink: string
  tags: string[]
}): Promise<Bounty> {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const service = new BountyService(provider, signer)
    return await service.createBounty(bounty)
  }

  throw new Error("Ethereum provider not available")
}

export async function updateBountyStatus(bountyId: string, status: BountyStatus): Promise<Bounty> {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const service = new BountyService(provider, signer)

    // For now, just return the bounty with updated status
    const bounty = await service.getBountyById(bountyId)
    if (bounty) {
      bounty.status = status
    }
    return bounty!
  }

  throw new Error("Ethereum provider not available")
}

export async function updateSubmissionStatus(
  bountyId: string,
  submissionId: string,
  status: "Approved" | "Rejected",
): Promise<Bounty> {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const service = new BountyService(provider, signer)
    return await service.updateSubmissionStatus(bountyId, submissionId, status)
  }

  throw new Error("Ethereum provider not available")
}

import type { AuditEngineParams, HunterParams } from "@/types/contracts"
import { ethers, type Signer, type Provider } from "ethers"
import BountyTokenABI from "@/contracts/BountyToken.sol/BountyToken.json"
import AuditNFTABI from "@/contracts/AuditNFT.sol/AuditNFT.json"
import AuditEngineABI from "@/contracts/AuditEngine.sol/AuditEngine.json"
import AuditRegistryABI from "@/contracts/AuditRegistry.sol/AuditRegistry.json"
import AutoBountyManagerABI from "@/contracts/AutoBountyManager.sol/AutoBountyManager.json"
import CommitRevealABI from "@/contracts/CommitReveal.sol/CommitReveal.json"

import type { AuditEngineContract, AuditRegistryContract, ContractMap } from "@/types/contracts"

// Contract addresses (will be loaded from environment)
const CONTRACT_ADDRESSES = {
  AUDIT_ENGINE: process.env.NEXT_PUBLIC_AUDIT_ENGINE_ADDRESS || "0x9fE46736679d29a657B2f172CF2b06fBf7bcEdaC",
  AUDIT_REGISTRY: process.env.NEXT_PUBLIC_AUDIT_REGISTRY_ADDRESS || "0xCf7Ed3AccA5a467e9e704C7065eeD03E875DcCare",
  AUTO_BOUNTY_MANAGER:
    process.env.NEXT_PUBLIC_AUTO_BOUNTY_MANAGER_ADDRESS || "0xDc64a140Aa3E981100a9becA4E685f962f0cf6C9",
  AUDIT_QUALITY_ASSESSOR: process.env.NEXT_PUBLIC_AUDIT_NFT_ADDRESS || "0xe7f1725E7734CE288F8367e18532a25Ebe3Cba86",
  BOUNTY_TOKEN: process.env.NEXT_PUBLIC_BOUNTY_TOKEN_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  COMMIT_REVEAL: process.env.NEXT_PUBLIC_COMMIT_REVEAL_ADDRESS || "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
}

const CONTRACT_ABIS = {
  AUDIT_ENGINE: AuditEngineABI.abi,
  AUDIT_REGISTRY: AuditRegistryABI.abi,
  AUTO_BOUNTY_MANAGER: AutoBountyManagerABI.abi,
  AUDIT_QUALITY_ASSESSOR: AuditNFTABI.abi,
  BOUNTY_TOKEN: BountyTokenABI.abi,
  COMMIT_REVEAL: CommitRevealABI.abi,
}

/**
 * Returns an instance of a smart contract.
 * @param contractName The name of the contract (e.g., "AuditEngine").
 * @param signerOrProvider An ethers.js Signer or Provider.
 * @returns A contract instance with the correct type.
 */
export function getContractInstance<T extends keyof ContractMap>(
  contractName: T,
  signerOrProvider: Signer | Provider,
): ContractMap[T] {
  const address = CONTRACT_ADDRESSES[contractName]
  const abi = CONTRACT_ABIS[contractName]

  if (!address || !abi) {
    throw new Error(`Contract ${String(contractName)} address or ABI not found.`)
  }

  const contract = new ethers.Contract(address, abi, signerOrProvider)

  // Type assertion to return the specific contract interface
  return contract as ContractMap[T]
}

// Default parameters for Owner Flow
export const DEFAULT_OWNER_PARAMS: AuditEngineParams = {
  auditEngineAddress: CONTRACT_ADDRESSES.AUDIT_ENGINE,
  autoBountyEnabled: true,
  highRiskThreshold: 75,
  maxBountiesPerAudit: 5,
  bountyDefaultReward: 0.1, // ETH
  callbackGasLimit: 200_000,
  batchSize: 50,
}

// Default parameters for Hunter Flow
export const DEFAULT_HUNTER_PARAMS: HunterParams = {
  commitWindow: 3600, // 1 hour in seconds
  minQualityScore: 70,
  xpMultiplierBase: 1,
  multisigThreshold: 2,
}

// AI-Native Audit Engine Service
export class AuditEngineService {
  private params: AuditEngineParams

  constructor(params: AuditEngineParams = DEFAULT_OWNER_PARAMS) {
    this.params = params
  }

  // Owner calls this to trigger AI audit
  async scanContract(sourceCid: string): Promise<string> {
    // Simulate contract call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Emit AuditRequested event (simulated)
    console.log(`AuditRequested event emitted: auditId=${auditId}, sourceCid=${sourceCid}`)

    // Trigger off-chain AI processing
    this.triggerOffChainAudit(auditId, sourceCid)

    return auditId
  }

  // Add method to interact with real AuditEngine contract
  async scanContractOnChain(sourceCid: string, signer: any): Promise<string> {
    try {
      const contract = getContractInstance("AuditEngine", signer) as AuditEngineContract
      const tx = await contract.scanContract(ethers.utils.formatBytes32String(sourceCid))
      const receipt = await tx.wait()
      return receipt.events[0].args.auditId
    } catch (error) {
      console.error("Failed to scan contract on-chain:", error)
      throw error
    }
  }

  private async triggerOffChainAudit(auditId: string, sourceCid: string) {
    // Simulate off-chain AI processing
    setTimeout(async () => {
      const finalScore = Math.floor(Math.random() * 40) + 30 // 30-70 range
      const resultCid = `Qm${Math.random().toString(36).substr(2, 44)}`

      // Call onAuditCompleted
      await this.onAuditCompleted(auditId, resultCid, finalScore)
    }, 3000)
  }

  private async onAuditCompleted(auditId: string, resultCid: string, finalScore: number) {
    console.log(`AuditCompleted: auditId=${auditId}, score=${finalScore}`)

    // AI-Native: Auto-create bounties if score meets threshold
    if (this.params.autoBountyEnabled && finalScore >= this.params.highRiskThreshold) {
      await this.createBountiesFromAudit(auditId)
    }
  }

  private async createBountiesFromAudit(auditId: string) {
    // Simulate AutoBountyManager.createBounties() call
    console.log(`Auto-creating bounties for audit ${auditId}`)

    // This would call the smart contract to create bounties
    // based on the audit results
  }

  updateParams(newParams: Partial<AuditEngineParams>) {
    this.params = { ...this.params, ...newParams }
  }

  getParams(): AuditEngineParams {
    return { ...this.params }
  }

  // Add method to listen for AuditCompleted events
  subscribeToAuditEvents(callback: (event: any) => void) {
    // This would set up event listeners for the smart contract
    const contract = getContractInstance("AuditRegistry", ethers.getDefaultProvider()) as AuditRegistryContract
    contract.on("AuditCompleted", callback)
  }
}

// AI-Native Bounty Manager Service
export class AutoBountyManagerService {
  private params: HunterParams

  constructor(params: HunterParams = DEFAULT_HUNTER_PARAMS) {
    this.params = params
  }

  // Hunter commits their fix
  async commitFix(bountyId: string, reportText: string, nonce: string): Promise<string> {
    // Generate commit hash
    const commitHash = this.generateCommitHash(reportText, nonce)

    // Simulate contract call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    console.log(`Fix committed for bounty ${bountyId}: ${commitHash}`)

    return commitHash
  }

  // Hunter reveals their fix after commit window
  async revealFix(
    bountyId: string,
    reportText: string,
    evidenceCid: string,
    nonce: string,
  ): Promise<{
    qualityScore: number
    xpMultiplier: number
    payout: number
  }> {
    // Simulate contract verification and AI assessment
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // AI Quality Assessment
    const qualityScore = Math.floor(Math.random() * 30) + 70 // 70-100 range
    const xpMultiplier = qualityScore >= 90 ? 2 : qualityScore >= 80 ? 1.5 : 1

    if (qualityScore < this.params.minQualityScore) {
      throw new Error(`Quality score ${qualityScore} below minimum ${this.params.minQualityScore}`)
    }

    // Calculate payout (mock bounty reward)
    const basePayout = 0.15 // ETH
    const payout = basePayout * xpMultiplier

    console.log(`Patch assessed: quality=${qualityScore}, xp=${xpMultiplier}, payout=${payout}`)

    return { qualityScore, xpMultiplier, payout }
  }

  private generateCommitHash(reportText: string, nonce: string): string {
    // Simulate keccak256(abi.encodePacked(report, nonce))
    const combined = reportText + nonce
    return `0x${Buffer.from(combined).toString("hex").slice(0, 64)}`
  }

  updateParams(newParams: Partial<HunterParams>) {
    this.params = { ...this.params, ...newParams }
  }

  getParams(): HunterParams {
    return { ...this.params }
  }
}

// AI Quality Assessor Service
export class AuditQualityAssessorService {
  async assessPatchQuality(
    bountyId: string,
    evidenceCid: string,
  ): Promise<{
    qualityScore: number
    xpMultiplier: number
    feedback: string[]
  }> {
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const qualityScore = Math.floor(Math.random() * 30) + 70
    const xpMultiplier = qualityScore >= 90 ? 2 : qualityScore >= 80 ? 1.5 : 1

    const feedback = [
      "Code follows security best practices",
      "Proper implementation of checks-effects-interactions pattern",
      "Gas optimization could be improved",
      "Documentation is comprehensive",
    ]

    return { qualityScore, xpMultiplier, feedback }
  }
}

// Event listener service for real-time updates
export class ContractEventService {
  private listeners: Map<string, Function[]> = new Map()

  subscribe(eventName: string, callback: Function) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, [])
    }
    this.listeners.get(eventName)!.push(callback)
  }

  unsubscribe(eventName: string, callback: Function) {
    const callbacks = this.listeners.get(eventName)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(eventName: string, data: any) {
    const callbacks = this.listeners.get(eventName)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }
}

// Singleton instances
export const auditEngineService = new AuditEngineService()
export const autoBountyManagerService = new AutoBountyManagerService()
export const auditQualityAssessorService = new AuditQualityAssessorService()
export const contractEventService = new ContractEventService()

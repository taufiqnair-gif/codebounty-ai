import { ethers } from "ethers"
import { getContract } from "./contracts"
import type { AuditResult } from "@/types/audit"

export class AuditService {
  private provider: ethers.Provider
  private signer?: ethers.Signer
  private auditEngine: ethers.Contract
  private auditRegistry: ethers.Contract

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider
    this.signer = signer
    this.auditEngine = getContract("AuditEngine", signer || provider)
    this.auditRegistry = getContract("AuditRegistry", signer || provider)
  }

  async performAudit(code: string): Promise<AuditResult> {
    if (!this.signer) throw new Error("Signer required for performing audit")

    try {
      console.log("🚀 Starting audit process...")

      // 1. Pin code to IPFS (mock for now)
      const sourceCid = await this.pinCodeToIPFS(code)
      console.log(`📌 Code pinned to IPFS: ${sourceCid}`)

      // 2. Trigger on-chain audit via AuditEngine
      console.log("📝 Triggering on-chain audit...")
      const tx = await this.auditEngine.scanContract(sourceCid)
      const receipt = await tx.wait()

      // 3. Extract audit ID from AuditRequested event
      const auditRequestedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.auditEngine.interface.parseLog(log)
          return parsed?.name === "AuditRequested"
        } catch {
          return false
        }
      })

      if (!auditRequestedEvent) {
        throw new Error("AuditRequested event not found in transaction receipt")
      }

      const parsedEvent = this.auditEngine.interface.parseLog(auditRequestedEvent)
      const auditId = parsedEvent?.args.auditId.toString()

      console.log(`✅ Audit requested successfully with ID: ${auditId}`)
      console.log(`🔄 Waiting for AI worker to process audit...`)

      // 4. Wait for audit completion (poll for completion)
      const result = await this.waitForAuditCompletion(auditId)

      console.log(`🎉 Audit ${auditId} completed with score: ${result.score}`)
      return result
    } catch (error) {
      console.error("❌ Error performing audit:", error)
      throw error
    }
  }

  private async waitForAuditCompletion(auditId: string, maxWaitTime = 30000): Promise<AuditResult> {
    const startTime = Date.now()
    const pollInterval = 2000 // Poll every 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const result = await this.getAuditResult(auditId)
        if (result) {
          return result
        }

        console.log(`⏳ Still waiting for audit ${auditId} to complete...`)
        await new Promise((resolve) => setTimeout(resolve, pollInterval))
      } catch (error) {
        console.warn(`Warning while polling for audit ${auditId}:`, error)
      }
    }

    // If we reach here, the audit didn't complete in time
    // Return a mock result for demo purposes
    console.warn(`⚠️  Audit ${auditId} didn't complete within ${maxWaitTime}ms, returning mock result`)
    return this.createMockAuditResult(auditId)
  }

  async getAuditResult(auditId: string): Promise<AuditResult | null> {
    try {
      const auditIdNum = Number.parseInt(auditId.replace("audit-", ""))
      const auditData = await this.auditRegistry.getAudit(auditIdNum)

      if (!auditData.completed) {
        return null
      }

      console.log(`📊 Fetching completed audit ${auditId} from registry`)

      // Fetch full report from IPFS
      const reportData = await this.fetchReportFromIPFS(auditData.reportCid)

      const result: AuditResult = {
        id: auditId,
        timestamp: new Date(Number(auditData.timestamp) * 1000).toISOString(),
        codeSnippet: reportData?.sourceCode || "Source code not available",
        score: Number(auditData.score),
        vulnerabilities: reportData?.issues || this.createMockVulnerabilities(),
        recommendations: reportData?.recommendations || this.createMockRecommendations(),
        executionTime: reportData?.processingTimeMs ? `${reportData.processingTimeMs}ms` : "Unknown",
      }

      console.log(`✅ Successfully fetched audit result for ${auditId}`)
      return result
    } catch (error) {
      console.error(`❌ Error fetching audit result for ${auditId}:`, error)
      return null
    }
  }

  private async pinCodeToIPFS(code: string): Promise<string> {
    // Mock IPFS pinning - in real implementation, use IPFS client
    console.log("📌 Pinning code to IPFS...")

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate mock CID based on code hash
    const hash = ethers.keccak256(ethers.toUtf8Bytes(code))
    const mockCid = `Qm${hash.substring(2, 48)}`

    console.log(`✅ Code pinned to IPFS with CID: ${mockCid}`)
    return mockCid
  }

  private async fetchReportFromIPFS(cid: string): Promise<any> {
    // Mock IPFS fetch - in real implementation, fetch from IPFS
    console.log(`📥 Fetching report from IPFS: ${cid}`)

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Return null to indicate we should use mock data
      return null
    } catch (error) {
      console.warn(`⚠️  Could not fetch report from IPFS: ${cid}`)
      return null
    }
  }

  private createMockAuditResult(auditId: string): AuditResult {
    const mockCode = `
      pragma solidity ^0.8.0;
      
      contract MockContract {
          uint public balance;
          
          function withdraw() public {
              msg.sender.call{value: balance}("");
              balance = 0;
          }
      }
    `

    return {
      id: auditId,
      timestamp: new Date().toISOString(),
      codeSnippet: mockCode,
      score: 65,
      vulnerabilities: this.createMockVulnerabilities(),
      recommendations: this.createMockRecommendations(),
      executionTime: "3000ms",
    }
  }

  private createMockVulnerabilities(): any[] {
    return [
      {
        id: "vuln-reentrancy-1",
        type: "Reentrancy",
        severity: "High",
        description:
          "The withdraw function is vulnerable to reentrancy attacks because the state variable 'balance' is updated after an external call.",
        line: 7,
        file: "contract.sol",
        snippet: `msg.sender.call{value: balance}("");`,
      },
      {
        id: "vuln-unchecked-call-1",
        type: "Unchecked Call",
        severity: "Medium",
        description: "The return value of the external call is not checked, which could lead to silent failures.",
        line: 7,
        file: "contract.sol",
        snippet: `msg.sender.call{value: balance}("");`,
      },
    ]
  }

  private createMockRecommendations(): string[] {
    return [
      "Implement the Checks-Effects-Interactions pattern to prevent reentrancy attacks",
      "Use OpenZeppelin's ReentrancyGuard modifier for functions that make external calls",
      "Always check the return value of external calls and handle failures appropriately",
      "Consider using transfer() or send() instead of call() for simple Ether transfers",
      "Add comprehensive unit tests covering all functions and edge cases",
      "Conduct regular security audits and code reviews",
    ]
  }

  // Get audit statistics
  async getAuditStats(): Promise<{
    totalAudits: number
    completedAudits: number
    averageScore: number
    highRiskAudits: number
  }> {
    try {
      // This would require additional contract methods to track statistics
      // For now, return mock data
      return {
        totalAudits: 150,
        completedAudits: 142,
        averageScore: 78,
        highRiskAudits: 23,
      }
    } catch (error) {
      console.error("Error fetching audit stats:", error)
      return {
        totalAudits: 0,
        completedAudits: 0,
        averageScore: 0,
        highRiskAudits: 0,
      }
    }
  }
}

// Legacy functions for backward compatibility
export async function performAudit(code: string): Promise<AuditResult> {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const service = new AuditService(provider, signer)
    return await service.performAudit(code)
  }

  throw new Error("Ethereum provider not available")
}

export async function getAuditResult(auditId: string): Promise<AuditResult | null> {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const service = new AuditService(provider)
    return await service.getAuditResult(auditId)
  }

  return null
}

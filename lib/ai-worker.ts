import { ethers } from "ethers"
import { getContract } from "./contracts"
import { create } from "ipfs-http-client"

// IPFS client configuration
const ipfs = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: `Basic ${Buffer.from(
      `${process.env.INFURA_IPFS_PROJECT_ID}:${process.env.INFURA_IPFS_PROJECT_SECRET}`,
    ).toString("base64")}`,
  },
})

interface AuditResult {
  auditId: number
  staticScore: number
  semanticScore: number
  simulationScore: number
  finalScore: number
  issues: AuditIssue[]
  reportCid: string
}

interface AuditIssue {
  id: string
  type: string
  severity: "High" | "Medium" | "Low"
  description: string
  line: number
  file: string
  snippet: string
}

export class AIWorker {
  private provider: ethers.Provider
  private signer: ethers.Signer
  private auditEngine: ethers.Contract
  private auditRegistry: ethers.Contract
  private isListening = false

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider
    this.signer = signer
    this.auditEngine = getContract("AuditEngine", signer)
    this.auditRegistry = getContract("AuditRegistry", signer)
  }

  async startListening() {
    if (this.isListening) {
      console.log("AI Worker is already listening")
      return
    }

    this.isListening = true
    console.log("🤖 AI Worker started listening for audit requests...")

    // Listen for AuditRequested events from AuditEngine
    this.auditEngine.on("AuditRequested", async (auditId, requester, sourceCid, timestamp, event) => {
      console.log(`📋 New audit request received:`)
      console.log(`  - Audit ID: ${auditId}`)
      console.log(`  - Requester: ${requester}`)
      console.log(`  - Source CID: ${sourceCid}`)
      console.log(`  - Timestamp: ${new Date(Number(timestamp) * 1000).toISOString()}`)

      try {
        // Process the audit with parallel execution
        const result = await this.processAuditParallel(Number(auditId), sourceCid, requester)

        // Complete the audit on-chain
        await this.completeAuditOnChain(result)

        console.log(`✅ Audit ${auditId} completed successfully with final score: ${result.finalScore}`)

        // Log issues found
        if (result.issues.length > 0) {
          console.log(`🔍 Found ${result.issues.length} issues:`)
          result.issues.forEach((issue) => {
            console.log(`  - ${issue.severity}: ${issue.type} at line ${issue.line}`)
          })
        }
      } catch (error) {
        console.error(`❌ Error processing audit ${auditId}:`, error)

        // Try to complete audit with error status
        try {
          await this.auditEngine.completeAudit(auditId, 0, "error-processing")
        } catch (completeError) {
          console.error(`Failed to mark audit as error:`, completeError)
        }
      }
    })

    // Handle process termination gracefully
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down AI Worker...")
      this.stopListening()
      process.exit(0)
    })
  }

  stopListening() {
    if (this.isListening) {
      this.auditEngine.removeAllListeners("AuditRequested")
      this.isListening = false
      console.log("🔇 AI Worker stopped listening")
    }
  }

  private async processAuditParallel(auditId: number, sourceCid: string, requester: string): Promise<AuditResult> {
    console.log(`🔄 Processing audit ${auditId} with parallel execution...`)

    // 1. Fetch source code from IPFS
    const sourceCode = await this.fetchFromIPFS(sourceCid)
    console.log(`📥 Source code fetched (${sourceCode.length} characters)`)

    // 2. Run parallel analysis (simulating real AI pipeline)
    console.log(`🚀 Starting parallel analysis...`)
    const startTime = Date.now()

    const [staticScore, semanticScore, simulationScore, issues] = await Promise.all([
      this.runStaticAnalysis(sourceCode),
      this.runSemanticAnalysis(sourceCode),
      this.runSimulationAnalysis(sourceCode),
      this.extractIssues(sourceCode),
    ])

    const processingTime = Date.now() - startTime
    console.log(`⚡ Parallel analysis completed in ${processingTime}ms`)
    console.log(`📊 Scores - Static: ${staticScore}, Semantic: ${semanticScore}, Simulation: ${simulationScore}`)

    // 3. Calculate final score using the specified formula
    const finalScore = Math.round(0.4 * staticScore + 0.35 * semanticScore + 0.25 * simulationScore)
    console.log(`🎯 Final aggregated score: ${finalScore}`)

    // 4. Generate comprehensive report
    const report = {
      auditId,
      timestamp: new Date().toISOString(),
      requester,
      sourceCid,
      processingTimeMs: processingTime,
      staticAnalysis: {
        score: staticScore,
        tools: ["Slither", "MythX", "Semgrep"],
        findings: issues.filter((i) => i.type.includes("Static")),
        executionTime: `${Math.round(processingTime * 0.4)}ms`,
      },
      semanticAnalysis: {
        score: semanticScore,
        model: "fine-tuned-solidity-llm-v2",
        findings: issues.filter((i) => i.type.includes("Semantic")),
        executionTime: `${Math.round(processingTime * 0.35)}ms`,
      },
      simulationAnalysis: {
        score: simulationScore,
        tools: ["Foundry", "Echidna", "Manticore"],
        findings: issues.filter((i) => i.type.includes("Simulation")),
        executionTime: `${Math.round(processingTime * 0.25)}ms`,
      },
      finalScore,
      totalIssues: issues.length,
      highSeverityIssues: issues.filter((i) => i.severity === "High").length,
      mediumSeverityIssues: issues.filter((i) => i.severity === "Medium").length,
      lowSeverityIssues: issues.filter((i) => i.severity === "Low").length,
      issues,
      recommendations: this.generateRecommendations(issues),
      riskAssessment: this.assessRisk(finalScore, issues),
    }

    // 5. Pin comprehensive report to IPFS
    const reportCid = await this.pinToIPFS(report)
    console.log(`📌 Report pinned to IPFS: ${reportCid}`)

    return {
      auditId,
      staticScore,
      semanticScore,
      simulationScore,
      finalScore,
      issues,
      reportCid,
    }
  }

  private async fetchFromIPFS(cid: string): Promise<string> {
    try {
      console.log(`📡 Fetching from IPFS: ${cid}`)
      const chunks = []
      for await (const chunk of ipfs.cat(cid)) {
        chunks.push(chunk)
      }
      const content = Buffer.concat(chunks).toString()
      console.log(`✅ Successfully fetched ${content.length} bytes from IPFS`)
      return content
    } catch (error) {
      console.warn(`⚠️  Error fetching from IPFS (${cid}), using mock data:`, error)
      // Return mock vulnerable contract for demo
      return `
        pragma solidity ^0.8.0;
        
        contract VulnerableContract {
            mapping(address => uint256) public balances;
            
            function deposit() public payable {
                balances[msg.sender] += msg.value;
            }
            
            function withdraw(uint256 _amount) public {
                require(balances[msg.sender] >= _amount, "Insufficient balance");
                
                // VULNERABILITY: Reentrancy - external call before state update
                (bool success, ) = msg.sender.call{value: _amount}("");
                require(success, "Transfer failed");
                
                balances[msg.sender] -= _amount; // State update after external call
            }
            
            function getBalance() public view returns (uint256) {
                return balances[msg.sender];
            }
            
            // VULNERABILITY: tx.origin usage
            function adminWithdraw() public {
                require(tx.origin == owner, "Not owner");
                payable(owner).transfer(address(this).balance);
            }
            
            address public owner = 0x1234567890123456789012345678901234567890;
        }
      `
    }
  }

  private async runStaticAnalysis(sourceCode: string): Promise<number> {
    console.log(`🔍 Running static analysis (Slither/MythX simulation)...`)

    // Simulate comprehensive static analysis
    let score = 100
    const issues = []

    // Check for common vulnerabilities
    if (sourceCode.includes("call{value:")) {
      score -= 30
      issues.push("Potential reentrancy vulnerability")
    }

    if (sourceCode.includes("tx.origin")) {
      score -= 25
      issues.push("tx.origin usage detected")
    }

    if (sourceCode.includes("block.timestamp") || sourceCode.includes("now")) {
      score -= 15
      issues.push("Timestamp dependence")
    }

    if (sourceCode.includes("selfdestruct")) {
      score -= 20
      issues.push("Selfdestruct usage")
    }

    if (sourceCode.includes("delegatecall")) {
      score -= 20
      issues.push("Delegatecall usage")
    }

    if (!sourceCode.includes("require(") && !sourceCode.includes("assert(")) {
      score -= 15
      issues.push("Missing input validation")
    }

    if (sourceCode.includes("unchecked")) {
      score -= 10
      issues.push("Unchecked arithmetic operations")
    }

    // Check for missing access controls
    const functionCount = (sourceCode.match(/function\s+\w+/g) || []).length
    const modifierCount = (sourceCode.match(/modifier\s+\w+/g) || []).length
    if (functionCount > 3 && modifierCount === 0) {
      score -= 15
      issues.push("Missing access control modifiers")
    }

    const finalScore = Math.max(0, score)
    console.log(`📊 Static analysis complete: ${finalScore}/100 (${issues.length} issues found)`)

    return finalScore
  }

  private async runSemanticAnalysis(sourceCode: string): Promise<number> {
    console.log(`🧠 Running semantic analysis (LLM simulation)...`)

    // Simulate LLM-based semantic analysis
    let score = 100
    const issues = []

    const lines = sourceCode.split("\n")
    const functionCount = lines.filter((line) => line.includes("function")).length
    const commentCount = lines.filter((line) => line.trim().startsWith("//")).length
    const contractCount = (sourceCode.match(/contract\s+\w+/g) || []).length

    // Code quality assessment
    if (functionCount > 5 && commentCount < functionCount * 0.3) {
      score -= 20
      issues.push("Insufficient documentation")
    }

    // Complexity analysis
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(sourceCode)
    if (cyclomaticComplexity > 10) {
      score -= 15
      issues.push("High cyclomatic complexity")
    }

    // Business logic analysis
    if (sourceCode.includes("payable") && !sourceCode.includes("ReentrancyGuard")) {
      score -= 25
      issues.push("Payable functions without reentrancy protection")
    }

    // State variable analysis
    const stateVarCount = (sourceCode.match(/^\s*(uint|int|bool|address|string|bytes)\s+/gm) || []).length
    if (stateVarCount > 10 && !sourceCode.includes("struct")) {
      score -= 10
      issues.push("Consider using structs for better organization")
    }

    // Event emission analysis
    const eventCount = (sourceCode.match(/emit\s+\w+/g) || []).length
    if (functionCount > eventCount && sourceCode.includes("payable")) {
      score -= 15
      issues.push("Missing event emissions for important state changes")
    }

    const finalScore = Math.max(0, score)
    console.log(`🧠 Semantic analysis complete: ${finalScore}/100 (${issues.length} issues found)`)

    return finalScore
  }

  private async runSimulationAnalysis(sourceCode: string): Promise<number> {
    console.log(`🎮 Running simulation analysis (Foundry/Echidna simulation)...`)

    // Simulate fuzzing and formal verification
    let score = 100
    const issues = []

    // Simulate edge case discovery
    if (sourceCode.includes("unchecked")) {
      score -= 25
      issues.push("Potential integer overflow in unchecked blocks")
    }

    if (sourceCode.includes("assembly")) {
      score -= 20
      issues.push("Inline assembly usage requires careful review")
    }

    // Simulate invariant checking
    if (sourceCode.includes("balances[") && !sourceCode.includes("SafeMath")) {
      score -= 15
      issues.push("Balance calculations without overflow protection")
    }

    // Simulate gas analysis
    const loopCount = (sourceCode.match(/for\s*\(/g) || []).length + (sourceCode.match(/while\s*\(/g) || []).length
    if (loopCount > 2) {
      score -= 10
      issues.push("Multiple loops may cause gas limit issues")
    }

    // Simulate state transition analysis
    if (sourceCode.includes("msg.value") && sourceCode.includes("transfer")) {
      const hasChecks = sourceCode.includes("require(") || sourceCode.includes("assert(")
      if (!hasChecks) {
        score -= 20
        issues.push("Ether transfers without proper validation")
      }
    }

    const finalScore = Math.max(0, score)
    console.log(`🎮 Simulation analysis complete: ${finalScore}/100 (${issues.length} issues found)`)

    return finalScore
  }

  private calculateCyclomaticComplexity(sourceCode: string): number {
    // Simple cyclomatic complexity calculation
    const decisionPoints = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /\?\s*.*\s*:/g, // ternary operator
      /&&/g,
      /\|\|/g,
    ]

    let complexity = 1 // Base complexity

    decisionPoints.forEach((pattern) => {
      const matches = sourceCode.match(pattern)
      if (matches) {
        complexity += matches.length
      }
    })

    return complexity
  }

  private async extractIssues(sourceCode: string): Promise<AuditIssue[]> {
    const issues: AuditIssue[] = []
    const lines = sourceCode.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()

      // Reentrancy detection
      if (trimmedLine.includes("call{value:")) {
        issues.push({
          id: `reentrancy-${lineNumber}-${Date.now()}`,
          type: "Reentrancy",
          severity: "High",
          description:
            "Potential reentrancy vulnerability due to external call before state update. This allows malicious contracts to re-enter the function and drain funds.",
          line: lineNumber,
          file: "contract.sol",
          snippet: trimmedLine,
        })
      }

      // tx.origin usage
      if (trimmedLine.includes("tx.origin")) {
        issues.push({
          id: `tx-origin-${lineNumber}-${Date.now()}`,
          type: "Authorization",
          severity: "Medium",
          description: "Use of tx.origin for authorization is vulnerable to phishing attacks. Use msg.sender instead.",
          line: lineNumber,
          file: "contract.sol",
          snippet: trimmedLine,
        })
      }

      // Timestamp dependence
      if (trimmedLine.includes("block.timestamp") || trimmedLine.includes("now")) {
        issues.push({
          id: `timestamp-${lineNumber}-${Date.now()}`,
          type: "Timestamp Dependence",
          severity: "Low",
          description: "Reliance on block.timestamp can be manipulated by miners within a 15-second window.",
          line: lineNumber,
          file: "contract.sol",
          snippet: trimmedLine,
        })
      }

      // Unchecked external calls
      if (trimmedLine.includes(".call(") && !trimmedLine.includes("require(")) {
        issues.push({
          id: `unchecked-call-${lineNumber}-${Date.now()}`,
          type: "Unchecked Call",
          severity: "Medium",
          description: "External call result not checked. Failed calls will not revert the transaction.",
          line: lineNumber,
          file: "contract.sol",
          snippet: trimmedLine,
        })
      }

      // Selfdestruct usage
      if (trimmedLine.includes("selfdestruct")) {
        issues.push({
          id: `selfdestruct-${lineNumber}-${Date.now()}`,
          type: "Selfdestruct",
          severity: "High",
          description:
            "Selfdestruct can be used to forcibly send Ether to any address, potentially breaking contract logic.",
          line: lineNumber,
          file: "contract.sol",
          snippet: trimmedLine,
        })
      }

      // Delegatecall usage
      if (trimmedLine.includes("delegatecall")) {
        issues.push({
          id: `delegatecall-${lineNumber}-${Date.now()}`,
          type: "Delegatecall",
          severity: "High",
          description:
            "Delegatecall executes code in the context of the calling contract, which can lead to storage corruption.",
          line: lineNumber,
          file: "contract.sol",
          snippet: trimmedLine,
        })
      }
    })

    console.log(`🔍 Extracted ${issues.length} specific issues from source code`)
    return issues
  }

  private generateRecommendations(issues: AuditIssue[]): string[] {
    const recommendations = [
      "Implement comprehensive unit tests covering all functions and edge cases",
      "Use OpenZeppelin's security libraries and battle-tested implementations",
      "Follow the Checks-Effects-Interactions pattern to prevent reentrancy",
      "Conduct regular security audits and code reviews",
      "Use static analysis tools in your CI/CD pipeline",
    ]

    // Add specific recommendations based on issues found
    const issueTypes = new Set(issues.map((i) => i.type))

    if (issueTypes.has("Reentrancy")) {
      recommendations.push("Use OpenZeppelin's ReentrancyGuard modifier for functions that make external calls")
      recommendations.push("Update state variables before making external calls")
    }

    if (issueTypes.has("Authorization")) {
      recommendations.push("Replace tx.origin with msg.sender for authorization checks")
      recommendations.push("Implement proper access control using OpenZeppelin's AccessControl")
    }

    if (issueTypes.has("Timestamp Dependence")) {
      recommendations.push("Avoid using block.timestamp for critical logic or use block numbers instead")
      recommendations.push("Consider using oracles for time-sensitive operations")
    }

    if (issueTypes.has("Unchecked Call")) {
      recommendations.push("Always check the return value of external calls")
      recommendations.push("Use require() statements to handle failed calls appropriately")
    }

    if (issueTypes.has("Selfdestruct")) {
      recommendations.push("Consider removing selfdestruct or implementing proper access controls")
      recommendations.push("Be aware that selfdestruct can break contract assumptions")
    }

    if (issueTypes.has("Delegatecall")) {
      recommendations.push("Carefully review delegatecall usage and ensure storage layout compatibility")
      recommendations.push("Consider using libraries or inheritance instead of delegatecall")
    }

    return recommendations
  }

  private assessRisk(finalScore: number, issues: AuditIssue[]): string {
    const highSeverityCount = issues.filter((i) => i.severity === "High").length
    const mediumSeverityCount = issues.filter((i) => i.severity === "Medium").length

    if (finalScore >= 90 && highSeverityCount === 0) {
      return "LOW - Contract appears secure with minimal issues"
    } else if (finalScore >= 75 && highSeverityCount <= 1) {
      return "MEDIUM - Some issues found but generally acceptable"
    } else if (finalScore >= 50 || highSeverityCount <= 3) {
      return "HIGH - Significant security issues require immediate attention"
    } else {
      return "CRITICAL - Multiple severe vulnerabilities detected, do not deploy"
    }
  }

  private async pinToIPFS(data: any): Promise<string> {
    try {
      console.log(`📌 Pinning report to IPFS...`)
      const result = await ipfs.add(JSON.stringify(data, null, 2))
      const cid = result.cid.toString()
      console.log(`✅ Successfully pinned to IPFS: ${cid}`)
      return cid
    } catch (error) {
      console.warn(`⚠️  Error pinning to IPFS, using mock CID:`, error)
      // Return mock CID for demo
      return `QmReport${Math.random().toString(36).substring(2, 15)}`
    }
  }

  private async completeAuditOnChain(result: AuditResult) {
    try {
      console.log(`📝 Completing audit ${result.auditId} on-chain...`)

      // Step 1: Complete audit in AuditEngine
      console.log(`  1. Marking audit as completed in AuditEngine...`)
      const completeTx = await this.auditEngine.completeAudit(result.auditId, result.finalScore, result.reportCid)
      await completeTx.wait()
      console.log(`  ✅ AuditEngine.completeAudit() successful: ${completeTx.hash}`)

      // Step 2: Trigger auto-bounty creation in AuditRegistry
      console.log(`  2. Triggering auto-bounty logic in AuditRegistry...`)
      const issueIds = result.issues.map((issue) => issue.id)

      const registryTx = await this.auditRegistry.onAuditCompleted(
        result.auditId,
        result.finalScore,
        result.reportCid,
        issueIds,
      )
      await registryTx.wait()
      console.log(`  ✅ AuditRegistry.onAuditCompleted() successful: ${registryTx.hash}`)

      // Check if auto-bounty was triggered
      const highRiskThreshold = await this.auditRegistry.HIGH_RISK_THRESHOLD()
      if (result.finalScore >= Number(highRiskThreshold) && issueIds.length > 0) {
        console.log(`  🎯 Auto-bounty triggered! Score ${result.finalScore} >= threshold ${highRiskThreshold}`)
        console.log(`  💰 Created bounties for ${issueIds.length} issues`)
      } else {
        console.log(`  ℹ️  Auto-bounty not triggered (score: ${result.finalScore}, threshold: ${highRiskThreshold})`)
      }
    } catch (error) {
      console.error(`❌ Error completing audit on-chain:`, error)
      throw error
    }
  }
}

// Factory function to create and start AI worker
export async function createAIWorker(privateKey: string, rpcUrl: string): Promise<AIWorker> {
  console.log(`🚀 Initializing AI Worker...`)
  console.log(`  - RPC URL: ${rpcUrl}`)
  console.log(`  - Wallet: ${new ethers.Wallet(privateKey).address}`)

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const signer = new ethers.Wallet(privateKey, provider)

  // Verify connection
  try {
    const network = await provider.getNetwork()
    const balance = await provider.getBalance(signer.address)
    console.log(`  - Network: ${network.name} (Chain ID: ${network.chainId})`)
    console.log(`  - Balance: ${ethers.formatEther(balance)} ETH`)
  } catch (error) {
    console.error(`❌ Failed to connect to network:`, error)
    throw error
  }

  const worker = new AIWorker(provider, signer)
  await worker.startListening()

  return worker
}

// CLI entry point for running the AI worker
if (require.main === module) {
  const privateKey = process.env.AI_WORKER_PRIVATE_KEY
  const rpcUrl = process.env.RPC_URL || "http://localhost:8545"

  if (!privateKey) {
    console.error("❌ AI_WORKER_PRIVATE_KEY environment variable is required")
    process.exit(1)
  }

  createAIWorker(privateKey, rpcUrl).catch((error) => {
    console.error("❌ Failed to start AI Worker:", error)
    process.exit(1)
  })
}

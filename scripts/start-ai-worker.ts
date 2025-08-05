#!/usr/bin/env node

import { createAIWorker } from "../lib/ai-worker"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

async function main() {
  console.log("🚀 Starting CodeBountyAI Worker...")
  console.log("=====================================")

  // Validate required environment variables
  const requiredEnvVars = ["AI_WORKER_PRIVATE_KEY", "RPC_URL", "INFURA_IPFS_PROJECT_ID", "INFURA_IPFS_PROJECT_SECRET"]

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missingEnvVars.length > 0) {
    console.error("❌ Missing required environment variables:")
    missingEnvVars.forEach((envVar) => {
      console.error(`   - ${envVar}`)
    })
    console.error("\nPlease set these variables in your .env file")
    process.exit(1)
  }

  // Validate contract addresses
  const contractAddresses = [
    "NEXT_PUBLIC_AUDIT_ENGINE_ADDRESS",
    "NEXT_PUBLIC_AUDIT_REGISTRY_ADDRESS",
    "NEXT_PUBLIC_AUTO_BOUNTY_MANAGER_ADDRESS",
  ]

  const missingAddresses = contractAddresses.filter(
    (addr) => !process.env[addr] || process.env[addr] === "0x0000000000000000000000000000000000000000",
  )

  if (missingAddresses.length > 0) {
    console.warn("⚠️  Some contract addresses are not set:")
    missingAddresses.forEach((addr) => {
      console.warn(`   - ${addr}`)
    })
    console.warn("Make sure contracts are deployed and addresses are configured")
  }

  try {
    // Start the AI worker
    const worker = await createAIWorker(process.env.AI_WORKER_PRIVATE_KEY!, process.env.RPC_URL!)

    console.log("✅ AI Worker started successfully!")
    console.log("🎯 Ready to process audit requests...")
    console.log("📡 Listening for AuditRequested events...")
    console.log("\nPress Ctrl+C to stop the worker")

    // Keep the process running
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down AI Worker...")
      worker.stopListening()
      process.exit(0)
    })

    // Keep alive
    setInterval(() => {
      // Heartbeat to keep process alive
    }, 30000)
  } catch (error) {
    console.error("❌ Failed to start AI Worker:", error)
    process.exit(1)
  }
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unhandled error:", error)
    process.exit(1)
  })
}

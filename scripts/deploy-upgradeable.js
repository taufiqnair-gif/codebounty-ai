const { ethers, upgrades } = require("hardhat")

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with the account:", deployer.address)

  // Deploy BountyToken (UUPS Upgradeable)
  const BountyToken = await ethers.getContractFactory("BountyToken")
  const bountyToken = await upgrades.deployProxy(
    BountyToken,
    [ethers.parseEther("1000000")], // Initial supply
    { kind: "uups" },
  )
  await bountyToken.waitForDeployment()
  console.log("BountyToken deployed to:", await bountyToken.getAddress())

  // Deploy AuditNFT (UUPS Upgradeable)
  const AuditNFT = await ethers.getContractFactory("AuditNFT")
  const auditNFT = await upgrades.deployProxy(AuditNFT, ["https://api.codebountyai.com/nft/"], { kind: "uups" })
  await auditNFT.waitForDeployment()
  console.log("AuditNFT deployed to:", await auditNFT.getAddress())

  // Deploy AuditEngine (UUPS Upgradeable)
  const AuditEngine = await ethers.getContractFactory("AuditEngine")
  const auditEngine = await upgrades.deployProxy(
    AuditEngine,
    [50], // CONCURRENCY_LEVEL = 50
    { kind: "uups" },
  )
  await auditEngine.waitForDeployment()
  console.log("AuditEngine deployed to:", await auditEngine.getAddress())

  // Deploy PatchAssessor (UUPS Upgradeable)
  const PatchAssessor = await ethers.getContractFactory("PatchAssessor")
  const patchAssessor = await upgrades.deployProxy(
    PatchAssessor,
    [70], // MIN_QUALITY_SCORE = 70
    { kind: "uups" },
  )
  await patchAssessor.waitForDeployment()
  console.log("PatchAssessor deployed to:", await patchAssessor.getAddress())

  // Deploy AutoBountyManager (UUPS Upgradeable)
  const AutoBountyManager = await ethers.getContractFactory("AutoBountyManager")
  const autoBountyManager = await upgrades.deployProxy(
    AutoBountyManager,
    [await bountyToken.getAddress(), await auditNFT.getAddress(), await patchAssessor.getAddress()],
    { kind: "uups" },
  )
  await autoBountyManager.waitForDeployment()
  console.log("AutoBountyManager deployed to:", await autoBountyManager.getAddress())

  // Deploy AuditRegistry (UUPS Upgradeable)
  const AuditRegistry = await ethers.getContractFactory("AuditRegistry")
  const auditRegistry = await upgrades.deployProxy(
    AuditRegistry,
    [
      75, // HIGH_RISK_THRESHOLD = 75
      70, // MIN_QUALITY_SCORE = 70
      ethers.parseEther("0.1"), // defaultRewardPerIssue = 0.1 ETH
      await autoBountyManager.getAddress(),
    ],
    { kind: "uups" },
  )
  await auditRegistry.waitForDeployment()
  console.log("AuditRegistry deployed to:", await auditRegistry.getAddress())

  // Deploy CommitReveal (UUPS Upgradeable)
  const CommitReveal = await ethers.getContractFactory("CommitReveal")
  const commitReveal = await upgrades.deployProxy(
    CommitReveal,
    [86400], // REVEAL_PERIOD = 24 hours
    { kind: "uups" },
  )
  await commitReveal.waitForDeployment()
  console.log("CommitReveal deployed to:", await commitReveal.getAddress())

  // Setup permissions
  console.log("Setting up permissions...")

  // Transfer ownership of AuditNFT to AutoBountyManager
  await auditNFT.transferOwnership(await autoBountyManager.getAddress())
  console.log("AuditNFT ownership transferred to AutoBountyManager")

  // Transfer some tokens to AutoBountyManager for bounty rewards
  const transferAmount = ethers.parseEther("100000")
  await bountyToken.transfer(await autoBountyManager.getAddress(), transferAmount)
  console.log(`Transferred ${ethers.formatEther(transferAmount)} BTY to AutoBountyManager`)

  // Approve AutoBountyManager to spend tokens from deployer
  const approveAmount = ethers.parseEther("500000")
  await bountyToken.approve(await autoBountyManager.getAddress(), approveAmount)
  console.log(`Approved ${ethers.formatEther(approveAmount)} BTY for AutoBountyManager`)

  console.log("\n=== Deployment Summary ===")
  console.log("BountyToken:", await bountyToken.getAddress())
  console.log("AuditNFT:", await auditNFT.getAddress())
  console.log("AuditEngine:", await auditEngine.getAddress())
  console.log("PatchAssessor:", await patchAssessor.getAddress())
  console.log("AutoBountyManager:", await autoBountyManager.getAddress())
  console.log("AuditRegistry:", await auditRegistry.getAddress())
  console.log("CommitReveal:", await commitReveal.getAddress())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

const { ethers } = require("hardhat")

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log("Deploying contracts with the account:", deployer.address)

  const BountyToken = await ethers.getContractFactory("BountyToken")
  const bountyToken = await BountyToken.deploy(ethers.parseEther("1000000")) // Initial supply of 1,000,000 tokens
  await bountyToken.waitForDeployment()
  console.log("BountyToken deployed to:", bountyToken.target)

  const AuditNFT = await ethers.getContractFactory("AuditNFT")
  const auditNFT = await AuditNFT.deploy("https://example.com/audit-nfts/")
  await auditNFT.waitForDeployment()
  console.log("AuditNFT deployed to:", auditNFT.target)

  const AuditRegistry = await ethers.getContractFactory("AuditRegistry")
  const auditRegistry = await AuditRegistry.deploy()
  await auditRegistry.waitForDeployment()
  console.log("AuditRegistry deployed to:", auditRegistry.target)

  const AuditEngine = await ethers.getContractFactory("AuditEngine")
  const auditEngine = await AuditEngine.deploy()
  await auditEngine.waitForDeployment()
  console.log("AuditEngine deployed to:", auditEngine.target)

  const CommitReveal = await ethers.getContractFactory("CommitReveal")
  const commitReveal = await CommitReveal.deploy()
  await commitReveal.waitForDeployment()
  console.log("CommitReveal deployed to:", commitReveal.target)

  const AutoBountyManager = await ethers.getContractFactory("AutoBountyManager")
  const autoBountyManager = await AutoBountyManager.deploy(auditRegistry.target, auditNFT.target, bountyToken.target)
  await autoBountyManager.waitForDeployment()
  console.log("AutoBountyManager deployed to:", autoBountyManager.target)

  // Grant MINTER_ROLE to AutoBountyManager if BountyToken uses AccessControl
  // If BountyToken is Ownable and mint function is onlyOwner, then the deployer (owner) can mint.
  // If AutoBountyManager needs to mint, then BountyToken's mint function needs to be public
  // and AutoBountyManager needs to be granted minter role or be the owner.
  // For this simple setup, we assume deployer mints and transfers to AutoBountyManager.

  // Example: Transfer some tokens to the AutoBountyManager for bounties
  const transferAmount = ethers.parseEther("10000")
  await bountyToken.transfer(autoBountyManager.target, transferAmount)
  console.log(`Transferred ${transferAmount} BTY to AutoBountyManager`)

  // Set AutoBountyManager as minter for AuditNFT if needed
  // If AuditNFT's safeMint is onlyOwner, then deployer (owner) can call it.
  // If AutoBountyManager needs to mint NFTs, then AuditNFT's safeMint needs to be public
  // and AutoBountyManager needs to be granted minter role or be the owner.
  // For this setup, AutoBountyManager is the owner of AuditNFT.
  await auditNFT.transferOwnership(autoBountyManager.target)
  console.log("AuditNFT ownership transferred to AutoBountyManager")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("CodeBountyAI Contracts", () => {
  let BountyToken, bountyToken
  let AuditNFT, auditNFT
  let AuditRegistry, auditRegistry
  let AuditEngine, auditEngine
  let CommitReveal, commitReveal
  let AutoBountyManager, autoBountyManager
  let owner, addr1, addr2

  const initialSupply = ethers.parseEther("1000000")
  const baseTokenURI = "https://example.com/audit-nfts/"

  beforeEach(async () => {
    ;[owner, addr1, addr2] = await ethers.getSigners()

    // Deploy BountyToken
    BountyToken = await ethers.getContractFactory("BountyToken")
    bountyToken = await BountyToken.deploy(initialSupply)
    await bountyToken.waitForDeployment()

    // Deploy AuditNFT
    AuditNFT = await ethers.getContractFactory("AuditNFT")
    auditNFT = await AuditNFT.deploy(baseTokenURI)
    await auditNFT.waitForDeployment()

    // Deploy AuditRegistry
    AuditRegistry = await ethers.getContractFactory("AuditRegistry")
    auditRegistry = await AuditRegistry.deploy()
    await auditRegistry.waitForDeployment()

    // Deploy AuditEngine
    AuditEngine = await ethers.getContractFactory("AuditEngine")
    auditEngine = await AuditEngine.deploy()
    await auditEngine.waitForDeployment()

    // Deploy CommitReveal
    CommitReveal = await ethers.getContractFactory("CommitReveal")
    commitReveal = await CommitReveal.deploy()
    await commitReveal.waitForDeployment()

    // Deploy AutoBountyManager
    AutoBountyManager = await ethers.getContractFactory("AutoBountyManager")
    autoBountyManager = await AutoBountyManager.deploy(auditRegistry.target, auditNFT.target, bountyToken.target)
    await autoBountyManager.waitForDeployment()

    // Transfer AuditNFT ownership to AutoBountyManager
    await auditNFT.transferOwnership(autoBountyManager.target)

    // Transfer some BountyTokens to addr1 and addr2 for testing
    await bountyToken.transfer(addr1.address, ethers.parseEther("1000"))
    await bountyToken.transfer(addr2.address, ethers.parseEther("1000"))
  })

  describe("BountyToken", () => {
    it("Should have correct name and symbol", async () => {
      expect(await bountyToken.name()).to.equal("BountyToken")
      expect(await bountyToken.symbol()).to.equal("BTY")
    })

    it("Should mint initial supply to deployer", async () => {
      expect(await bountyToken.totalSupply()).to.equal(initialSupply)
      expect(await bountyToken.balanceOf(owner.address)).to.equal(initialSupply.sub(ethers.parseEther("2000"))) // After transfers to addr1, addr2
    })

    it("Should allow owner to mint new tokens", async () => {
      const mintAmount = ethers.parseEther("100")
      await bountyToken.mint(addr1.address, mintAmount)
      expect(await bountyToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("1100"))
    })

    it("Should not allow non-owner to mint new tokens", async () => {
      const mintAmount = ethers.parseEther("100")
      await expect(bountyToken.connect(addr1).mint(addr1.address, mintAmount)).to.be.revertedWithCustomError(
        bountyToken,
        "OwnableUnauthorizedAccount",
      )
    })
  })

  describe("AuditNFT", () => {
    it("Should have correct name and symbol", async () => {
      expect(await auditNFT.name()).to.equal("AuditNFT")
      expect(await auditNFT.symbol()).to.equal("ANFT")
    })

    it("Should allow owner to mint NFTs", async () => {
      await auditNFT.safeMint(owner.address, "ipfs://test-uri-1")
      expect(await auditNFT.ownerOf(0)).to.equal(owner.address)
      expect(await auditNFT.tokenURI(0)).to.equal("ipfs://test-uri-1")
    })

    it("Should not allow non-owner to mint NFTs", async () => {
      await expect(auditNFT.connect(addr1).safeMint(addr1.address, "ipfs://test-uri-2")).to.be.revertedWithCustomError(
        auditNFT,
        "OwnableUnauthorizedAccount",
      )
    })

    it("Should allow owner to set base URI", async () => {
      const newBaseURI = "https://new.example.com/"
      await auditNFT.setBaseURI(newBaseURI)
      await auditNFT.safeMint(owner.address, "test-uri-3")
      expect(await auditNFT.tokenURI(0)).to.equal("https://new.example.com/test-uri-3")
    })
  })

  describe("AuditRegistry", () => {
    it("Should register an audit", async () => {
      const codeHash = "0x123abc"
      await expect(auditRegistry.registerAudit(addr1.address, codeHash))
        .to.emit(auditRegistry, "AuditRegistered")
        .withArgs(1, addr1.address, codeHash)

      const audit = await auditRegistry.audits(1)
      expect(audit.requester).to.equal(addr1.address)
      expect(audit.codeHash).to.equal(codeHash)
      expect(audit.completed).to.be.false
    })

    it("Should update an audit", async () => {
      const codeHash = "0x123abc"
      await auditRegistry.registerAudit(addr1.address, codeHash)
      const auditId = 1
      const score = 95
      const reportHash = "0xdef456"

      await expect(auditRegistry.updateAudit(auditId, score, reportHash))
        .to.emit(auditRegistry, "AuditUpdated")
        .withArgs(auditId, score, reportHash)

      const audit = await auditRegistry.audits(auditId)
      expect(audit.score).to.equal(score)
      expect(audit.reportHash).to.equal(reportHash)
      expect(audit.completed).to.be.true
    })

    it("Should not update non-existent audit", async () => {
      await expect(auditRegistry.updateAudit(999, 90, "0xabc")).to.be.revertedWith("Audit does not exist")
    })
  })

  describe("AuditEngine", () => {
    it("Should request an audit", async () => {
      const codeHash = "0xabc123"
      await expect(auditEngine.requestAudit(codeHash))
        .to.emit(auditEngine, "AuditRequested")
        .withArgs((await ethers.provider.getBlockNumber()) + 1, owner.address, codeHash) // block.timestamp will be current block timestamp
    })

    it("Should complete an audit", async () => {
      const auditId = 123
      const score = 88
      const reportHash = "0xdef456"
      await expect(auditEngine.completeAudit(auditId, score, reportHash))
        .to.emit(auditEngine, "AuditCompleted")
        .withArgs(auditId, score, reportHash)
    })
  })

  describe("CommitReveal", () => {
    it("Should allow a user to commit", async () => {
      const value = "secret_data"
      const salt = "random_salt"
      const commitHash = ethers.keccak256(ethers.toUtf8Bytes(value + salt))

      await expect(commitReveal.connect(addr1).commit(commitHash))
        .to.emit(commitReveal, "Committed")
        .withArgs(addr1.address, commitHash)

      const commit = await commitReveal.commits(addr1.address)
      expect(commit.commitHash).to.equal(commitHash)
      expect(commit.revealed).to.be.false
    })

    it("Should allow a user to reveal", async () => {
      const value = "secret_data"
      const salt = "random_salt"
      const commitHash = ethers.keccak256(ethers.toUtf8Bytes(value + salt))

      await commitReveal.connect(addr1).commit(commitHash)
      await expect(commitReveal.connect(addr1).reveal(value, salt))
        .to.emit(commitReveal, "Revealed")
        .withArgs(addr1.address, value)

      const commit = await commitReveal.commits(addr1.address)
      expect(commit.revealed).to.be.true
    })

    it("Should not allow invalid reveal", async () => {
      const value = "secret_data"
      const salt = "random_salt"
      const commitHash = ethers.keccak256(ethers.toUtf8Bytes(value + salt))

      await commitReveal.connect(addr1).commit(commitHash)
      await expect(commitReveal.connect(addr1).reveal("wrong_value", salt)).to.be.revertedWith("Invalid reveal")
    })
  })

  describe("AutoBountyManager", () => {
    const auditId = 1
    const rewardAmount = ethers.parseEther("100")
    const durationDays = 7
    const codeHash = "0xabc123"
    const reportHash = "report_hash_123"

    beforeEach(async () => {
      // Register and complete an audit first
      await auditRegistry.registerAudit(owner.address, codeHash)
      await auditRegistry.updateAudit(auditId, 90, "audit_report_hash")

      // Approve AutoBountyManager to spend tokens from owner
      await bountyToken.approve(autoBountyManager.target, rewardAmount)
    })

    it("Should create a bounty", async () => {
      await expect(autoBountyManager.createBounty(auditId, rewardAmount, durationDays))
        .to.emit(autoBountyManager, "BountyCreated")
        .withArgs(
          1,
          auditId,
          owner.address,
          rewardAmount,
          (await ethers.provider.getBlock("latest")).timestamp + durationDays * 24 * 60 * 60,
        )

      const bounty = await autoBountyManager.bounties(1)
      expect(bounty.poster).to.equal(owner.address)
      expect(bounty.rewardAmount).to.equal(rewardAmount)
      expect(bounty.isActive).to.be.true
    })

    it("Should not create a bounty for incomplete audit", async () => {
      await auditRegistry.registerAudit(owner.address, "0xdef456") // Audit ID 2, not completed
      await expect(autoBountyManager.createBounty(2, rewardAmount, durationDays)).to.be.revertedWith(
        "Audit must be completed to create a bounty",
      )
    })

    it("Should allow a hunter to submit a solution", async () => {
      await autoBountyManager.createBounty(auditId, rewardAmount, durationDays)
      const bountyId = 1

      await expect(autoBountyManager.connect(addr1).submitSolution(bountyId, reportHash))
        .to.emit(autoBountyManager, "SubmissionReceived")
        .withArgs(bountyId, addr1.address, reportHash)

      const bounty = await autoBountyManager.bounties(bountyId)
      expect(bounty.submissions.length).to.equal(1)
      expect(bounty.submissions[0]).to.equal(addr1.address)
      expect(bounty.hasSubmitted[addr1.address]).to.be.true
    })

    it("Should not allow multiple submissions from the same hunter", async () => {
      await autoBountyManager.createBounty(auditId, rewardAmount, durationDays)
      const bountyId = 1

      await autoBountyManager.connect(addr1).submitSolution(bountyId, reportHash)
      await expect(autoBountyManager.connect(addr1).submitSolution(bountyId, reportHash)).to.be.revertedWith(
        "Already submitted to this bounty",
      )
    })

    it("Should resolve a bounty and transfer reward", async () => {
      await autoBountyManager.createBounty(auditId, rewardAmount, durationDays)
      const bountyId = 1
      await autoBountyManager.connect(addr1).submitSolution(bountyId, reportHash)

      const initialHunterBalance = await bountyToken.balanceOf(addr1.address)
      const initialManagerBalance = await bountyToken.balanceOf(autoBountyManager.target)

      await expect(autoBountyManager.resolveBounty(bountyId, addr1.address, reportHash))
        .to.emit(autoBountyManager, "BountyResolved")
        .withArgs(bountyId, addr1.address, rewardAmount)
        .and.to.emit(autoBountyManager, "BountyClosed")
        .withArgs(bountyId)

      expect(await bountyToken.balanceOf(addr1.address)).to.equal(initialHunterBalance.add(rewardAmount))
      expect(await bountyToken.balanceOf(autoBountyManager.target)).to.equal(initialManagerBalance.sub(rewardAmount))

      const bounty = await autoBountyManager.bounties(bountyId)
      expect(bounty.isActive).to.be.false
      expect(bounty.winner).to.equal(addr1.address)
      expect(bounty.paid).to.be.true

      // Check NFT minting
      expect(await auditNFT.ownerOf(0)).to.equal(addr1.address)
      expect(await auditNFT.tokenURI(0)).to.equal(`ipfs://audit-report/${reportHash}`)
    })

    it("Should not resolve a bounty with non-submitter as winner", async () => {
      await autoBountyManager.createBounty(auditId, rewardAmount, durationDays)
      const bountyId = 1
      await autoBountyManager.connect(addr1).submitSolution(bountyId, reportHash)

      await expect(autoBountyManager.resolveBounty(bountyId, addr2.address, reportHash)).to.be.revertedWith(
        "Winner must be a valid submitter",
      )
    })

    it("Should allow poster to close bounty and get refund if no winner", async () => {
      await autoBountyManager.createBounty(auditId, rewardAmount, durationDays)
      const bountyId = 1

      const initialPosterBalance = await bountyToken.balanceOf(owner.address)
      const initialManagerBalance = await bountyToken.balanceOf(autoBountyManager.target)

      await expect(autoBountyManager.closeBounty(bountyId))
        .to.emit(autoBountyManager, "BountyClosed")
        .withArgs(bountyId)

      expect(await bountyToken.balanceOf(owner.address)).to.equal(initialPosterBalance.add(rewardAmount))
      expect(await bountyToken.balanceOf(autoBountyManager.target)).to.equal(initialManagerBalance.sub(rewardAmount))

      const bounty = await autoBountyManager.bounties(bountyId)
      expect(bounty.isActive).to.be.false
      expect(bounty.paid).to.be.false // Not paid to a winner
    })

    it("Should not allow non-poster/non-owner to close bounty", async () => {
      await autoBountyManager.createBounty(auditId, rewardAmount, durationDays)
      const bountyId = 1

      await expect(autoBountyManager.connect(addr1).closeBounty(bountyId)).to.be.revertedWith(
        "Only poster or owner can close bounty",
      )
    })
  })
})

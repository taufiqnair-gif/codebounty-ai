const { expect } = require("chai")
const { ethers, upgrades } = require("hardhat")

describe("CodeBountyAI Contracts", () => {
  let BountyToken, AuditNFT, AuditEngine, AuditRegistry, AutoBountyManager, CommitReveal
  let bountyToken, auditNFT, auditEngine, auditRegistry, autoBountyManager, commitReveal
  let owner, hunter1, hunter2, platformFeeRecipient

  const INITIAL_SUPPLY = ethers.parseEther("1000000") // 1 million tokens
  const BOUNTY_REWARD = ethers.parseEther("100")
  const PLATFORM_FEE_BPS = 100 // 1%

  beforeEach(async () => {
    ;[owner, hunter1, hunter2, platformFeeRecipient] = await ethers.getSigners()

    // Deploy BountyToken
    BountyToken = await ethers.getContractFactory("BountyToken")
    bountyToken = await upgrades.deployProxy(BountyToken, ["CodeBounty Token", "CBT"], { initializer: "initialize" })
    await bountyToken.waitForDeployment()

    // Deploy AuditNFT
    AuditNFT = await ethers.getContractFactory("AuditNFT")
    auditNFT = await upgrades.deployProxy(AuditNFT, ["CodeBounty Audit NFT", "CBA"], { initializer: "initialize" })
    await auditNFT.waitForDeployment()

    // Deploy AuditEngine
    AuditEngine = await ethers.getContractFactory("AuditEngine")
    auditEngine = await upgrades.deployProxy(AuditEngine, [], { initializer: "initialize" })
    await auditEngine.waitForDeployment()

    // Deploy AuditRegistry
    AuditRegistry = await ethers.getContractFactory("AuditRegistry")
    auditRegistry = await upgrades.deployProxy(AuditRegistry, [], { initializer: "initialize" })
    await auditRegistry.waitForDeployment()

    // Deploy CommitReveal
    CommitReveal = await ethers.getContractFactory("CommitReveal")
    commitReveal = await upgrades.deployProxy(CommitReveal, [10], { initializer: "initialize" }) // 10 blocks for reveal
    await commitReveal.waitForDeployment()

    // Deploy AutoBountyManager
    AutoBountyManager = await ethers.getContractFactory("AutoBountyManager")
    autoBountyManager = await upgrades.deployProxy(
      AutoBountyManager,
      [
        await auditEngine.getAddress(),
        await auditNFT.getAddress(),
        await auditRegistry.getAddress(),
        await bountyToken.getAddress(),
        PLATFORM_FEE_BPS,
      ],
      { initializer: "initialize" },
    )
    await autoBountyManager.waitForDeployment()

    // Set AutoBountyManager as owner of AuditNFT and AuditRegistry for minting/registering
    // NOTE: In a real scenario, you might want a more granular role-based access control
    // or transfer ownership to a multisig. For testing, we'll make the deployer the owner
    // and assume the deployer will call AutoBountyManager.
    // If AutoBountyManager needs to call mintNFT or registerAuditReport directly,
    // it would need to be the owner or have a minter/registrar role.
    // For this test, we'll assume the owner (deployer) of AuditNFT/AuditRegistry
    // will be the one calling the approveSubmission function on AutoBountyManager,
    // which then internally calls AuditNFT/AuditRegistry.
    // So, the owner of AuditNFT and AuditRegistry should be the deployer (owner).
    // This is already handled by the `OwnableUpgradeable` initializer.

    // Mint some tokens for the owner to create bounties
    await bountyToken.mint(owner.address, INITIAL_SUPPLY)
  })

  describe("BountyToken", () => {
    it("Should have the correct name and symbol", async () => {
      expect(await bountyToken.name()).to.equal("CodeBounty Token")
      expect(await bountyToken.symbol()).to.equal("CBT")
    })

    it("Should allow owner to mint tokens", async () => {
      await bountyToken.mint(hunter1.address, ethers.parseEther("1000"))
      expect(await bountyToken.balanceOf(hunter1.address)).to.equal(ethers.parseEther("1000"))
    })

    it("Should allow users to burn their own tokens", async () => {
      await bountyToken.mint(hunter1.address, ethers.parseEther("500"))
      await bountyToken.connect(hunter1).burn(ethers.parseEther("100"))
      expect(await bountyToken.balanceOf(hunter1.address)).to.equal(ethers.parseEther("400"))
    })
  })

  describe("AuditNFT", () => {
    it("Should mint a new NFT to the specified address", async () => {
      const tokenId = await auditNFT.mintNFT.staticCall(hunter1.address, "ipfs://testuri")
      await auditNFT.mintNFT(hunter1.address, "ipfs://testuri")
      expect(await auditNFT.ownerOf(tokenId)).to.equal(hunter1.address)
      expect(await auditNFT.tokenURI(tokenId)).to.equal("ipfs://testuri")
    })

    it("Only owner should be able to mint NFTs", async () => {
      await expect(auditNFT.connect(hunter1).mintNFT(hunter1.address, "ipfs://testuri")).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
  })

  describe("AuditEngine", () => {
    it("Should allow requesting an audit and emit an event", async () => {
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes("some code"))
      const auditId = await auditEngine.requestAudit.staticCall(codeHash)
      await expect(auditEngine.requestAudit(codeHash))
        .to.emit(auditEngine, "AuditRequested")
        .withArgs(auditId, owner.address, codeHash)

      const result = await auditEngine.auditResults(auditId)
      expect(result.auditor).to.equal(owner.address)
      expect(result.codeHash).to.equal(codeHash)
      expect(result.completed).to.be.false
    })

    it("Should allow owner to set audit result and emit an event", async () => {
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes("some code"))
      const auditId = await auditEngine.requestAudit.staticCall(codeHash)
      await auditEngine.requestAudit(codeHash)

      const score = 85
      const vulnerabilities = ["Reentrancy", "Front-running"]

      await expect(auditEngine.setAuditResult(auditId, score, vulnerabilities))
        .to.emit(auditEngine, "AuditCompleted")
        .withArgs(auditId, score, vulnerabilities)

      const result = await auditEngine.auditResults(auditId)
      expect(result.score).to.equal(score)
      expect(result.vulnerabilities).to.deep.equal(vulnerabilities)
      expect(result.completed).to.be.true
    })

    it("Should not allow non-owner to set audit result", async () => {
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes("some code"))
      const auditId = await auditEngine.requestAudit.staticCall(codeHash)
      await auditEngine.requestAudit(codeHash)

      await expect(auditEngine.connect(hunter1).setAuditResult(auditId, 80, [])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      )
    })
  })

  describe("AuditRegistry", () => {
    it("Should register an audit report and link NFT", async () => {
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes("audited code"))
      const nftTokenId = await auditNFT.mintNFT.staticCall(hunter1.address, "ipfs://nfturi")
      await auditNFT.mintNFT(hunter1.address, "ipfs://nfturi") // Mint the NFT first

      const reportId = await auditRegistry.registerAuditReport.staticCall(
        0, // auditId from engine (0 if not applicable)
        hunter1.address,
        codeHash,
        90,
        ["Low Severity"],
        nftTokenId,
        "ipfs://nfturi",
      )

      await expect(
        auditRegistry.registerAuditReport(
          0,
          hunter1.address,
          codeHash,
          90,
          ["Low Severity"],
          nftTokenId,
          "ipfs://nfturi",
        ),
      )
        .to.emit(auditRegistry, "AuditReportRegistered")
        .withArgs(reportId, hunter1.address, nftTokenId, 90, codeHash)

      const report = await auditRegistry.getAuditReport(reportId)
      expect(report.auditor).to.equal(hunter1.address)
      expect(report.nftTokenId).to.equal(nftTokenId)
      expect(await auditRegistry.nftToReportId(nftTokenId)).to.equal(reportId)
    })

    it("Only owner should be able to register audit reports", async () => {
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes("audited code"))
      const nftTokenId = await auditNFT.mintNFT.staticCall(hunter1.address, "ipfs://nfturi")
      await auditNFT.mintNFT(hunter1.address, "ipfs://nfturi")

      await expect(
        auditRegistry
          .connect(hunter1)
          .registerAuditReport(0, hunter1.address, codeHash, 90, ["Low Severity"], nftTokenId, "ipfs://nfturi"),
      ).to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

  describe("CommitReveal", () => {
    it("Should allow a user to commit a hash", async () => {
      const value = "mysecret"
      const salt = "randomsalt"
      const commitment = ethers.keccak256(ethers.toUtf8Bytes(value + salt))

      await expect(commitReveal.connect(hunter1).commit(commitment))
        .to.emit(commitReveal, "Committed")
        .withArgs(hunter1.address, commitment, (await ethers.provider.getBlockNumber()) + 1)

      expect(await commitReveal.commitments(hunter1.address)).to.equal(commitment)
      expect(await commitReveal.hasCommitted(hunter1.address)).to.be.true
    })

    it("Should allow a user to reveal within the period", async () => {
      const value = "mysecret"
      const salt = "randomsalt"
      const commitment = ethers.keccak256(ethers.toUtf8Bytes(value + salt))

      await commitReveal.connect(hunter1).commit(commitment)

      // Mine some blocks to enter reveal period but not exceed it
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", [])
      }

      await expect(commitReveal.connect(hunter1).reveal(value, salt))
        .to.emit(commitReveal, "Revealed")
        .withArgs(hunter1.address, value)

      expect(await commitReveal.hasRevealed(hunter1.address)).to.be.true
    })

    it("Should not allow revealing outside the period", async () => {
      const value = "mysecret"
      const salt = "randomsalt"
      const commitment = ethers.keccak256(ethers.toUtf8Bytes(value + salt))

      await commitReveal.connect(hunter1).commit(commitment)

      // Mine enough blocks to exceed reveal period (10 blocks + 1 for commit)
      for (let i = 0; i < 12; i++) {
        await ethers.provider.send("evm_mine", [])
      }

      await expect(commitReveal.connect(hunter1).reveal(value, salt)).to.be.revertedWith("Reveal period has ended")
    })

    it("Should not allow revealing with incorrect value/salt", async () => {
      const value = "mysecret"
      const salt = "randomsalt"
      const commitment = ethers.keccak256(ethers.toUtf8Bytes(value + salt))

      await commitReveal.connect(hunter1).commit(commitment)

      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", [])
      }

      await expect(commitReveal.connect(hunter1).reveal("wrongvalue", salt)).to.be.revertedWith(
        "Invalid reveal: commitment mismatch",
      )
    })
  })

  describe("AutoBountyManager", () => {
    let dueDate
    const codeHash = ethers.keccak256(ethers.toUtf8Bytes("vulnerable code"))

    beforeEach(async () => {
      dueDate = (await ethers.provider.getBlock("latest")).timestamp + 3600 // 1 hour from now

      // Hunter needs tokens to potentially receive rewards
      await bountyToken.mint(hunter1.address, ethers.parseEther("1000"))
      await bountyToken.mint(hunter2.address, ethers.parseEther("1000"))

      // Owner of AutoBountyManager (deployer) needs to approve tokens for bounty creation
      await bountyToken.approve(await autoBountyManager.getAddress(), BOUNTY_REWARD)
    })

    it("Should create a bounty and transfer reward tokens to the contract", async () => {
      const initialOwnerBalance = await bountyToken.balanceOf(owner.address)
      const initialContractBalance = await bountyToken.balanceOf(await autoBountyManager.getAddress())

      const bountyId = await autoBountyManager.createBounty.staticCall(
        "Test Bounty",
        "Find a bug",
        BOUNTY_REWARD,
        await bountyToken.getAddress(),
        dueDate,
        codeHash,
      )

      await expect(
        autoBountyManager.createBounty(
          "Test Bounty",
          "Find a bug",
          BOUNTY_REWARD,
          await bountyToken.getAddress(),
          dueDate,
          codeHash,
        ),
      )
        .to.emit(autoBountyManager, "BountyCreated")
        .withArgs(
          bountyId,
          owner.address,
          "Test Bounty",
          BOUNTY_REWARD,
          await bountyToken.getAddress(),
          dueDate,
          codeHash,
        )

      expect(await bountyToken.balanceOf(owner.address)).to.equal(initialOwnerBalance - BOUNTY_REWARD)
      expect(await bountyToken.balanceOf(await autoBountyManager.getAddress())).to.equal(
        initialContractBalance + BOUNTY_REWARD,
      )

      const bounty = await autoBountyManager.bounties(bountyId)
      expect(bounty.owner).to.equal(owner.address)
      expect(bounty.rewardAmount).to.equal(BOUNTY_REWARD)
      expect(bounty.status).to.equal(0) // Open
    })

    it("Should allow a hunter to submit a solution", async () => {
      const bountyId = await autoBountyManager.createBounty.staticCall(
        "Test Bounty",
        "Find a bug",
        BOUNTY_REWARD,
        await bountyToken.getAddress(),
        dueDate,
        codeHash,
      )
      await autoBountyManager.createBounty(
        "Test Bounty",
        "Find a bug",
        BOUNTY_REWARD,
        await bountyToken.getAddress(),
        dueDate,
        codeHash,
      )

      const solutionHash = ethers.keccak256(ethers.toUtf8Bytes("my solution"))
      const submissionId = await autoBountyManager.submitBountySolution.staticCall(
        bountyId,
        solutionHash,
        "https://report.link",
      )

      await expect(
        autoBountyManager.connect(hunter1).submitBountySolution(bountyId, solutionHash, "https://report.link"),
      )
        .to.emit(autoBountyManager, "SubmissionReceived")
        .withArgs(submissionId, bountyId, hunter1.address, solutionHash)

      const submission = await autoBountyManager.submissions(submissionId)
      expect(submission.hunter).to.equal(hunter1.address)
      expect(submission.bountyId).to.equal(bountyId)
      expect(submission.solutionHash).to.equal(solutionHash)
      expect(submission.auditReportLink).to.equal("https://report.link")
      expect(submission.approved).to.be.false
      expect(submission.rejected).to.be.false
    })

    it("Should allow bounty owner to approve a submission, distribute reward, and mint NFT", async () => {
      const bountyId = await autoBountyManager.createBounty.staticCall(
        "Test Bounty",
        "Find a bug",
        BOUNTY_REWARD,
        await bountyToken.getAddress(),
        dueDate,
        codeHash,
      )
      await autoBountyManager.createBounty(
        "Test Bounty",
        "Find a bug",
        BOUNTY_REWARD,
        await bountyToken.getAddress(),
        dueDate,
        codeHash,
      )

      const solutionHash = ethers.keccak256(ethers.toUtf8Bytes("my solution"))
      const submissionId = await autoBountyManager.submitBountySolution.staticCall(
        bountyId,
        solutionHash,
        "https://report.link",
      )
      await autoBountyManager.connect(hunter1).submitBountySolution(bountyId, solutionHash, "https://report.link")

      const initialHunterBalance = await bountyToken.balanceOf(hunter1.address)
      const initialContractBalance = await bountyToken.balanceOf(await autoBountyManager.getAddress())

      const auditScore = 95
      const vulnerabilities = ["No critical issues"]
      const auditNFTURI = "ipfs://approvednfturi"

      // Approve the submission
      // The owner of AutoBountyManager (deployer) calls this, and it internally calls AuditNFT/AuditRegistry
      const nftTokenId = await auditNFT.mintNFT.staticCall(hunter1.address, auditNFTURI) // Simulate NFT minting
      const reportId = await auditRegistry.registerAuditReport.staticCall(
        0,
        hunter1.address,
        codeHash,
        auditScore,
        vulnerabilities,
        nftTokenId,
        auditNFTURI,
      ) // Simulate report registration

      await expect(
        autoBountyManager.approveSubmission(bountyId, submissionId, auditScore, vulnerabilities, auditNFTURI),
      )
        .to.emit(autoBountyManager, "SubmissionApproved")
        .withArgs(
          submissionId,
          bountyId,
          hunter1.address,
          BOUNTY_REWARD - (BOUNTY_REWARD * BigInt(PLATFORM_FEE_BPS)) / 10000n,
          nftTokenId,
        )
        .and.to.emit(autoBountyManager, "BountyStatusUpdated")
        .withArgs(bountyId, 1) // Closed

      // Check token balances
      const expectedHunterReward = BOUNTY_REWARD - (BOUNTY_REWARD * BigInt(PLATFORM_FEE_BPS)) / 10000n
      const expectedPlatformFee = (BOUNTY_REWARD * BigInt(PLATFORM_FEE_BPS)) / 10000n

      expect(await bountyToken.balanceOf(hunter1.address)).to.equal(initialHunterBalance + expectedHunterReward)
      expect(await bountyToken.balanceOf(await autoBountyManager.getAddress())).to.equal(
        initialContractBalance - BOUNTY_REWARD,
      )
      expect(await bountyToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY + expectedPlatformFee) // Owner receives fee

      // Check NFT ownership
      expect(await auditNFT.ownerOf(nftTokenId)).to.equal(hunter1.address)
      expect(await auditNFT.tokenURI(nftTokenId)).to.equal(auditNFTURI)

      // Check submission status
      const submission = await autoBountyManager.submissions(submissionId)
      expect(submission.approved).to.be.true
      expect(submission.rejected).to.be.false
      expect(submission.auditNFTId).to.equal(nftTokenId)
      expect(submission.auditReportId).to.equal(reportId) // This will be the actual reportId from AuditRegistry

      // Check bounty status
      const bounty = await autoBountyManager.bounties(bountyId)
      expect(bounty.status).to.equal(1) // Closed
    })

    it("Should allow bounty owner to reject a submission", async () => {
      const bountyId = await autoBountyManager.createBounty.staticCall(
        "Test Bounty",
        "Find a bug",
        BOUNTY_REWARD,
        await bountyToken.getAddress(),
        dueDate,
        codeHash,
      )
      await autoBountyManager.createBounty(
        "Test Bounty",
        "Find a bug",
        BOUNTY_REWARD,
        await bountyToken.getAddress(),
        dueDate,
        codeHash,
      )

      const solutionHash = ethers.keccak256(ethers.toUtf8Bytes("my solution"))
      const submissionId = await autoBountyManager.submitBountySolution.staticCall(
        bountyId,
        solutionHash,
        "https://report.link",
      )
      await autoBountyManager.connect(hunter1).submitBountySolution(bountyId, solutionHash, "https://report.link")

      await expect(autoBountyManager.rejectSubmission(bountyId, submissionId))
        .to.emit(autoBountyManager, "SubmissionRejected")
        .withArgs(submissionId, bountyId, hunter1.address)

      const submission = await autoBountyManager.submissions(submissionId)
      expect(submission.rejected).to.be.true
      expect(submission.approved).to.be.false

      // Bounty status should remain Open if other submissions are pending or if not explicitly closed
      const bounty = await autoBountyManager.bounties(bountyId)
      expect(bounty.status).to.equal(0) // Still Open
    })

    it("Should allow bounty owner to close a bounty", async () => {
      const bountyId = await autoBountyManager.createBounty.staticCall(
        "Test Bounty",
        "Find a bug",
        BOUNTY_REWARD,
        await bountyToken.getAddress(),
        dueDate,
        codeHash,
      )
      await autoBountyManager.createBounty(
        "Test Bounty",
        "Find a bug",
        BOUNTY_REWARD,
        await bountyToken.getAddress(),
        dueDate,
        codeHash,
      )

      await expect(autoBountyManager.closeBounty(bountyId))
        .to.emit(autoBountyManager, "BountyStatusUpdated")
        .withArgs(bountyId, 1) // Closed

      const bounty = await autoBountyManager.bounties(bountyId)
      expect(bounty.status).to.equal(1) // Closed
    })

    it("Should not allow non-owner to approve/reject/close submissions/bounties", async () => {
      const bountyId = await autoBountyManager.createBounty.staticCall(
        "Test Bounty",
        "Find a bug",
        BOUNTY_REWARD,
        await bountyToken.getAddress(),
        dueDate,
        codeHash,
      )
      await autoBountyManager.createBounty(
        "Test Bounty",
        "Find a bug",
        BOUNTY_REWARD,
        await bountyToken.getAddress(),
        dueDate,
        codeHash,
      )

      const solutionHash = ethers.keccak256(ethers.toUtf8Bytes("my solution"))
      const submissionId = await autoBountyManager.submitBountySolution.staticCall(
        bountyId,
        solutionHash,
        "https://report.link",
      )
      await autoBountyManager.connect(hunter1).submitBountySolution(bountyId, solutionHash, "https://report.link")

      await expect(
        autoBountyManager.connect(hunter1).approveSubmission(bountyId, submissionId, 90, [], "ipfs://uri"),
      ).to.be.revertedWith("Only bounty owner can approve submissions")
      await expect(autoBountyManager.connect(hunter1).rejectSubmission(bountyId, submissionId)).to.be.revertedWith(
        "Only bounty owner can reject submissions",
      )
      await expect(autoBountyManager.connect(hunter1).closeBounty(bountyId)).to.be.revertedWith(
        "Only bounty owner can close bounty",
      )
    })
  })
})

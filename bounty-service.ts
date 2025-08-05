import { type Bounty, BountyStatus, type BountySubmission } from "@/types/bounty"

// Mock data for demonstration purposes
const mockBounties: Bounty[] = [
  {
    id: "bounty-1",
    title: "Smart Contract Reentrancy Bug Hunt",
    description:
      "Find and exploit reentrancy vulnerabilities in our new DeFi lending protocol. The contract handles large sums, so critical bugs are highly rewarded.",
    reward: "1000 USDC",
    status: BountyStatus.Open,
    dueDate: "2025-09-15T23:59:59Z",
    postedBy: "0xAbc...123",
    codeLink: "https://github.com/codebounty/defi-protocol/blob/main/LendingPool.sol",
    tags: ["DeFi", "Reentrancy", "Solidity"],
    submissions: [],
  },
  {
    id: "bounty-2",
    title: "NFT Marketplace Logic Audit",
    description:
      "Audit the logic for our new NFT marketplace. Focus on potential issues with minting, listing, and transfer mechanisms.",
    reward: "5 ETH",
    status: BountyStatus.Open,
    dueDate: "2025-10-01T23:59:59Z",
    postedBy: "0xDef...456",
    codeLink: "https://github.com/codebounty/nft-marketplace/blob/main/NFTMarket.sol",
    tags: ["NFT", "Marketplace", "Solidity"],
    submissions: [],
  },
  {
    id: "bounty-3",
    title: "Cross-chain Bridge Security Review",
    description:
      "Identify any vulnerabilities in our cross-chain bridge implementation that could lead to asset loss or unauthorized transfers.",
    reward: "2000 DAI",
    status: BountyStatus.Closed,
    dueDate: "2025-08-01T23:59:59Z",
    postedBy: "0xGhi...789",
    codeLink: "https://github.com/codebounty/cross-chain-bridge/blob/main/Bridge.sol",
    tags: ["Bridge", "Security", "Solidity"],
    submissions: [
      {
        id: "sub-1",
        hunterAddress: "0xHunter1",
        submissionDate: "2025-07-28T10:00:00Z",
        description: "Found a critical reentrancy bug in the `transferTokens` function.",
        status: "Approved",
        auditReportLink: "https://example.com/report-1",
      },
    ],
  },
  {
    id: "bounty-4",
    title: "DAO Governance Module Audit",
    description:
      "Review the governance module of our new DAO for any potential attack vectors, including vote manipulation or proposal execution flaws.",
    reward: "10000 BOUNTY",
    status: BountyStatus.Open,
    dueDate: "2025-11-01T23:59:59Z",
    postedBy: "0xJkl...012",
    codeLink: "https://github.com/codebounty/dao-governance/blob/main/Governance.sol",
    tags: ["DAO", "Governance", "Solidity"],
    submissions: [],
  },
  {
    id: "bounty-5",
    title: "Token Vesting Contract Review",
    description:
      "Examine our token vesting contract for any vulnerabilities that could allow premature token claims or incorrect distribution.",
    reward: "500 USDC",
    status: BountyStatus.Open,
    dueDate: "2025-09-01T23:59:59Z",
    postedBy: "0xMno...345",
    codeLink: "https://github.com/codebounty/token-vesting/blob/main/Vesting.sol",
    tags: ["Tokenomics", "Vesting", "Solidity"],
    submissions: [],
  },
]

export async function getBounties(status?: BountyStatus): Promise<Bounty[]> {
  console.log("Fetching bounties with status:", status || "All")
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call

  if (status) {
    return mockBounties.filter((bounty) => bounty.status === status)
  }
  return mockBounties
}

export async function getBountyById(id: string): Promise<Bounty | null> {
  console.log("Fetching bounty by ID:", id)
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call
  return mockBounties.find((bounty) => bounty.id === id) || null
}

export async function createBounty(bounty: Omit<Bounty, "id" | "status" | "submissions">): Promise<Bounty> {
  console.log("Creating new bounty:", bounty.title)
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
  const newBounty: Bounty = {
    id: `bounty-${mockBounties.length + 1}`,
    status: BountyStatus.Open,
    submissions: [],
    ...bounty,
  }
  mockBounties.push(newBounty)
  return newBounty
}

export async function submitBounty(
  bountyId: string,
  submission: Omit<BountySubmission, "id" | "submissionDate" | "status">,
): Promise<Bounty> {
  console.log(`Submitting to bounty ${bountyId} by ${submission.hunterAddress}`)
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

  const bounty = mockBounties.find((b) => b.id === bountyId)
  if (!bounty) {
    throw new Error("Bounty not found")
  }

  const newSubmission: BountySubmission = {
    id: `sub-${bounty.submissions.length + 1}`,
    submissionDate: new Date().toISOString(),
    status: "Pending", // Default status for new submissions
    ...submission,
  }
  bounty.submissions.push(newSubmission)
  return bounty
}

export async function updateBountyStatus(bountyId: string, status: BountyStatus): Promise<Bounty> {
  console.log(`Updating bounty ${bountyId} status to ${status}`)
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call

  const bounty = mockBounties.find((b) => b.id === bountyId)
  if (!bounty) {
    throw new Error("Bounty not found")
  }
  bounty.status = status
  return bounty
}

export async function updateSubmissionStatus(
  bountyId: string,
  submissionId: string,
  status: "Approved" | "Rejected",
): Promise<Bounty> {
  console.log(`Updating submission ${submissionId} for bounty ${bountyId} to ${status}`)
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call

  const bounty = mockBounties.find((b) => b.id === bountyId)
  if (!bounty) {
    throw new Error("Bounty not found")
  }
  const submission = bounty.submissions.find((s) => s.id === submissionId)
  if (!submission) {
    throw new Error("Submission not found")
  }
  submission.status = status
  return bounty
}

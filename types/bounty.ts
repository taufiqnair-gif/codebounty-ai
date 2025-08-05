export enum BountyStatus {
  Open = "Open",
  Closed = "Closed",
  // Add other statuses as needed, e.g., "In Review", "Completed"
}

export interface BountySubmission {
  id: string
  hunterAddress: string
  submissionDate: string
  description: string
  status: "Pending" | "Approved" | "Rejected"
  auditReportLink?: string // Link to a detailed audit report or fix
}

export interface Bounty {
  id: string
  title: string
  description: string
  reward: string // e.g., "1000 USDC", "5 ETH"
  status: BountyStatus
  dueDate: string // ISO string
  postedBy: string // Wallet address of the bounty poster
  codeLink: string // Link to the vulnerable code (e.g., GitHub, Etherscan)
  tags: string[]
  submissions: BountySubmission[]
}

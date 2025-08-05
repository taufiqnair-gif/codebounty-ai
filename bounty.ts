export enum BountyStatus {
  Open = "Open",
  Closed = "Closed",
  InProgress = "In Progress",
}

export interface BountySubmission {
  id: string
  hunterAddress: string
  submissionDate: string
  description: string
  status: "Pending" | "Approved" | "Rejected"
  auditReportLink?: string // Link to the detailed audit report/proof
}

export interface Bounty {
  id: string
  title: string
  description: string
  reward: string
  status: BountyStatus
  dueDate: string // ISO 8601 string
  postedBy: string // Ethereum address of the bounty owner
  codeLink: string // Link to the code repository or specific contract
  tags: string[]
  submissions: BountySubmission[]
}

import { ethers } from "ethers"

// Contract addresses - these would be deployed contract addresses
export const CONTRACT_ADDRESSES = {
  BountyToken: "0x1234567890123456789012345678901234567890",
  AuditNFT: "0x2345678901234567890123456789012345678901",
  AuditEngine: "0x3456789012345678901234567890123456789012",
  AuditRegistry: "0x4567890123456789012345678901234567890123",
  AutoBountyManager: "0x5678901234567890123456789012345678901234",
  CommitReveal: "0x6789012345678901234567890123456789012345",
  PatchAssessor: "0x7890123456789012345678901234567890123456",
}

// Contract ABIs - simplified for demo
export const CONTRACT_ABIS = {
  BountyToken: [
    "function mint(address to, uint256 amount) external",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
  ],
  AuditNFT: [
    "function mintAuditNFT(address hunter, uint256 auditId, uint256 bountyId, uint256 qualityScore, string memory evidenceCid) external returns (uint256)",
    "function getHunterNFTs(address hunter) external view returns (uint256[] memory)",
    "function nftMetadata(uint256 tokenId) external view returns (tuple(uint256 auditId, uint256 bountyId, uint256 qualityScore, string evidenceCid, uint256 timestamp))",
    "function tokenURI(uint256 tokenId) external view returns (string memory)",
  ],
  AuditEngine: [
    "function scanContract(string memory sourceCid) external returns (uint256)",
    "function completeAudit(uint256 auditId, uint256 score, string memory reportCid) external",
    "event AuditRequested(uint256 indexed auditId, address indexed requester, string sourceCid, uint256 timestamp)",
  ],
  AuditRegistry: [
    "function getAudit(uint256 auditId) external view returns (tuple(uint256 auditId, address requester, string sourceCid, uint256 score, string reportCid, bool completed, uint256 timestamp))",
    "function onAuditCompleted(uint256 auditId, uint256 score, string memory reportCid, string[] memory issueIds) external",
    "function HIGH_RISK_THRESHOLD() external view returns (uint256)",
    "function MIN_QUALITY_SCORE() external view returns (uint256)",
  ],
  AutoBountyManager: [
    "function createBounties(uint256 auditId, string[] memory issueIds, uint256[] memory rewardAmounts) external",
    "function submitSolution(uint256 bountyId, string memory reportHash) external",
    "function resolveBounty(uint256 bountyId, address winner, string memory evidenceCid) external",
    "function closeBounty(uint256 bountyId) external",
    "function bounties(uint256 bountyId) external view returns (tuple(uint256 bountyId, uint256 auditId, string issueId, address poster, uint256 rewardAmount, uint256 deadline, bool isActive))",
    "function getActiveBounties() external view returns (uint256[] memory)",
    "function getBountySubmissions(uint256 bountyId) external view returns (address[] memory)",
    "event BountyCreated(uint256 indexed bountyId, uint256 indexed auditId, string issueId, uint256 rewardAmount)",
    "event BountyResolved(uint256 indexed bountyId, address indexed winner, uint256 rewardAmount, uint256 qualityScore)",
  ],
  CommitReveal: [
    "function commit(uint256 bountyId, bytes32 commitHash) external",
    "function reveal(uint256 bountyId, string memory value, string memory nonce) external",
    "function getCommit(uint256 bountyId, address hunter) external view returns (tuple(bytes32 commitHash, bool revealed, string revealedValue, uint256 timestamp))",
  ],
  PatchAssessor: [
    "function assessPatch(uint256 bountyId, string memory patchCid) external returns (uint256)",
    "function getPatchAssessment(uint256 bountyId, address hunter) external view returns (tuple(uint256 score, string feedback, bool approved))",
  ],
}

// Contract factory function
export function getContract(
  contractName: keyof typeof CONTRACT_ADDRESSES,
  signerOrProvider: ethers.Signer | ethers.Provider,
): ethers.Contract {
  const address = CONTRACT_ADDRESSES[contractName]
  const abi = CONTRACT_ABIS[contractName]

  if (!address || !abi) {
    throw new Error(`Contract ${contractName} not found`)
  }

  return new ethers.Contract(address, abi, signerOrProvider)
}

// Helper function to get contract instance with type safety
export function getContractInstance<T extends ethers.Contract>(
  contractName: keyof typeof CONTRACT_ADDRESSES,
  signerOrProvider: ethers.Signer | ethers.Provider,
): T {
  return getContract(contractName, signerOrProvider) as T
}

// Contract interfaces for type safety
export interface BountyTokenContract extends ethers.Contract {
  mint(to: string, amount: bigint): Promise<ethers.ContractTransactionResponse>
  approve(spender: string, amount: bigint): Promise<ethers.ContractTransactionResponse>
  allowance(owner: string, spender: string): Promise<bigint>
  balanceOf(account: string): Promise<bigint>
  transfer(to: string, amount: bigint): Promise<ethers.ContractTransactionResponse>
}

export interface AutoBountyManagerContract extends ethers.Contract {
  createBounties(
    auditId: number,
    issueIds: string[],
    rewardAmounts: bigint[],
  ): Promise<ethers.ContractTransactionResponse>
  submitSolution(bountyId: number, reportHash: string): Promise<ethers.ContractTransactionResponse>
  resolveBounty(bountyId: number, winner: string, evidenceCid: string): Promise<ethers.ContractTransactionResponse>
  closeBounty(bountyId: number): Promise<ethers.ContractTransactionResponse>
  bounties(bountyId: number): Promise<any>
  getActiveBounties(): Promise<bigint[]>
  getBountySubmissions(bountyId: number): Promise<string[]>
  setPlatformFee(fee: bigint): Promise<ethers.ContractTransactionResponse>
  setAuditEngineAddress(address: string): Promise<ethers.ContractTransactionResponse>
}

export interface AuditEngineContract extends ethers.Contract {
  scanContract(sourceCid: string): Promise<ethers.ContractTransactionResponse>
  completeAudit(auditId: number, score: number, reportCid: string): Promise<ethers.ContractTransactionResponse>
}

export interface AuditRegistryContract extends ethers.Contract {
  getAudit(auditId: number): Promise<any>
  onAuditCompleted(
    auditId: number,
    score: number,
    reportCid: string,
    issueIds: string[],
  ): Promise<ethers.ContractTransactionResponse>
  HIGH_RISK_THRESHOLD(): Promise<bigint>
  MIN_QUALITY_SCORE(): Promise<bigint>
}

export interface CommitRevealContract extends ethers.Contract {
  commit(bountyId: number, commitHash: string): Promise<ethers.ContractTransactionResponse>
  reveal(bountyId: number, value: string, nonce: string): Promise<ethers.ContractTransactionResponse>
  getCommit(bountyId: number, hunter: string): Promise<any>
}

export interface AuditNFTContract extends ethers.Contract {
  mintAuditNFT(
    hunter: string,
    auditId: number,
    bountyId: number,
    qualityScore: number,
    evidenceCid: string,
  ): Promise<ethers.ContractTransactionResponse>
  getHunterNFTs(hunter: string): Promise<bigint[]>
  nftMetadata(tokenId: bigint): Promise<any>
  tokenURI(tokenId: bigint): Promise<string>
}

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 31337, // Hardhat local network
  name: "Hardhat",
  rpcUrl: "http://localhost:8545",
  blockExplorer: "http://localhost:8545",
}

// Utility functions
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address)
}

export function formatAddress(address: string): string {
  if (!isValidAddress(address)) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function parseEther(value: string): bigint {
  return ethers.parseEther(value)
}

export function formatEther(value: bigint): string {
  return ethers.formatEther(value)
}

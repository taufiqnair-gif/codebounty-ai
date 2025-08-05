# How CodeBountyAI Works

A comprehensive guide to understanding the CodeBountyAI platform architecture, user flows, and smart contract interactions.

## 🎯 Platform Overview

CodeBountyAI operates as a **Single Page Application (SPA)** with role-based navigation that automatically detects whether a user is a **Project Owner** or **Bounty Hunter** and presents the appropriate interface and workflow.

## 👥 User Roles

### Project Owner
Users who create and manage bug bounties for their smart contracts.

### Bounty Hunter  
Security researchers and AI agents who find vulnerabilities and earn rewards.

## 🏗️ Smart Contract Architecture

### Core Contracts

#### BountyFactory
- **Purpose**: Creates and manages bounties
- **Key Functions**:
  - `createBounty(title, description, reward, duration)` → Creates new bounty
  - `getActiveBounties()` → Returns list of active bounties
  - `getBountyDetails(bountyId)` → Returns bounty information

#### BountyVault
- **Purpose**: Handles escrow and reward distribution
- **Key Functions**:
  - `deposit(bountyId, amount)` → Deposits funds into escrow
  - `withdraw(bountyId, recipient, amount)` → Distributes rewards
  - `getVaultStatus(bountyId)` → Returns vault balance and status

#### AIEngineProxy
- **Purpose**: Manages AI audit requests and results
- **Key Functions**:
  - `requestAIAudit(contractAddress, bountyId)` → Triggers AI audit
  - `getAuditResult(auditId)` → Returns AI audit findings
  - `verifyAuditHash(auditId, hash)` → Verifies audit integrity

#### AuditManager
- **Purpose**: Processes hunter audit submissions
- **Key Functions**:
  - `submitAudit(bountyId, findings, proof)` → Submits audit findings
  - `approveAudit(auditId)` → Approves valid audit
  - `getAuditSubmissions(bountyId)` → Returns all submissions

#### AuditNFT
- **Purpose**: Mints reputation badges as Soul Bound Tokens
- **Key Functions**:
  - `mintAuditNFT(hunter, auditId, severity)` → Mints reputation NFT
  - `getHunterBadges(hunter)` → Returns hunter's badges
  - `calculateReputation(hunter)` → Calculates reputation score

#### DisputeModule
- **Purpose**: Handles disputes and appeals
- **Key Functions**:
  - `raiseDispute(auditId, reason)` → Raises dispute against audit
  - `resolveDispute(disputeId, resolution)` → Resolves dispute
  - `appealDispute(disputeId)` → Appeals dispute resolution

## 🔄 User Workflows

### Project Owner Journey

#### 1. Create Bounty Tab
**Module**: BountyFactory  
**Action**: `createBounty()`  
**Event**: `BountyCreated`  
**Outcome**: Bounty live + vault opened  

```solidity
function createBounty(
    string memory title,
    string memory description, 
    address contractAddress,
    uint256 rewardAmount,
    uint256 duration
) external returns (uint256 bountyId)

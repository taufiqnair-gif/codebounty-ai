// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "./AuditNFT.sol";
import "./PatchAssessor.sol";

contract AutoBountyManager is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    struct Bounty {
        uint256 bountyId;
        uint256 auditId;
        string issueId;
        address poster;
        uint256 rewardAmount;
        uint256 deadline;
        bool isActive;
        address[] submissions;
        mapping(address => bool) hasSubmitted;
        address winner;
        bool paid;
    }

    mapping(uint256 => Bounty) public bounties;
    uint256 private _nextBountyId;
    
    IERC20Upgradeable public bountyToken;
    AuditNFT public auditNFT;
    PatchAssessor public assessor;

    event BountyCreated(
        uint256 indexed bountyId, 
        uint256 indexed auditId, 
        string issueId,
        address indexed poster, 
        uint256 rewardAmount, 
        uint256 deadline
    );
    
    event SubmissionReceived(
        uint256 indexed bountyId, 
        address indexed hunter, 
        string reportHash
    );
    
    event BountyResolved(
        uint256 indexed bountyId, 
        address indexed winner, 
        uint256 rewardAmount,
        uint8 qualityScore
    );
    
    event BountyClosed(uint256 indexed bountyId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address bountyTokenAddress,
        address auditNFTAddress,
        address assessorAddress
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        
        bountyToken = IERC20Upgradeable(bountyTokenAddress);
        auditNFT = AuditNFT(auditNFTAddress);
        assessor = PatchAssessor(assessorAddress);
        _nextBountyId = 1;
    }

    function createBounties(
        uint256 auditId,
        string[] memory issueIds,
        uint256[] memory rewardAmounts
    ) public onlyOwner {
        require(issueIds.length == rewardAmounts.length, "AutoBountyManager: Arrays length mismatch");
        
        for (uint256 i = 0; i < issueIds.length; i++) {
            uint256 bountyId = _nextBountyId++;
            uint256 deadline = block.timestamp + 30 days; // Default 30 days
            
            bounties[bountyId].bountyId = bountyId;
            bounties[bountyId].auditId = auditId;
            bounties[bountyId].issueId = issueIds[i];
            bounties[bountyId].poster = msg.sender;
            bounties[bountyId].rewardAmount = rewardAmounts[i];
            bounties[bountyId].deadline = deadline;
            bounties[bountyId].isActive = true;
            bounties[bountyId].paid = false;
            
            // Mint tokens to this contract for escrow
            bountyToken.transferFrom(msg.sender, address(this), rewardAmounts[i]);
            
            emit BountyCreated(bountyId, auditId, issueIds[i], msg.sender, rewardAmounts[i], deadline);
        }
    }

    function submitSolution(uint256 bountyId, string memory reportHash) public {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.isActive, "AutoBountyManager: Bounty is not active");
        require(block.timestamp <= bounty.deadline, "AutoBountyManager: Bounty has expired");
        require(!bounty.hasSubmitted[msg.sender], "AutoBountyManager: Already submitted to this bounty");

        bounty.submissions.push(msg.sender);
        bounty.hasSubmitted[msg.sender] = true;

        emit SubmissionReceived(bountyId, msg.sender, reportHash);
    }

    function resolveBounty(
        uint256 bountyId, 
        address winner, 
        string memory evidenceCid
    ) public onlyOwner {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.isActive, "AutoBountyManager: Bounty is not active");
        require(!bounty.paid, "AutoBountyManager: Bounty already paid");
        
        // Verify winner is a valid submitter
        bool winnerFound = false;
        for(uint i = 0; i < bounty.submissions.length; i++) {
            if (bounty.submissions[i] == winner) {
                winnerFound = true;
                break;
            }
        }
        require(winnerFound, "AutoBountyManager: Winner must be a valid submitter");

        // Assess patch quality
        (uint8 score, string memory feedback) = assessor.assessPatchQuality(bountyId, evidenceCid);
        require(score >= assessor.MIN_QUALITY_SCORE(), "AutoBountyManager: Patch quality below threshold");

        bounty.winner = winner;
        bounty.isActive = false;

        // Transfer reward to winner
        require(bountyToken.transfer(winner, bounty.rewardAmount), "AutoBountyManager: Reward transfer failed");
        bounty.paid = true;

        // Mint NFT to winner
        auditNFT.safeMint(winner, bounty.auditId, bountyId, score, evidenceCid);

        emit BountyResolved(bountyId, winner, bounty.rewardAmount, score);
        emit BountyClosed(bountyId);
    }

    function closeBounty(uint256 bountyId) public {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.isActive, "AutoBountyManager: Bounty is not active");
        require(msg.sender == bounty.poster || msg.sender == owner(), "AutoBountyManager: Only poster or owner can close bounty");
        require(!bounty.paid, "AutoBountyManager: Bounty already paid");

        bounty.isActive = false;
        
        // Refund tokens if no winner was selected
        if (bounty.winner == address(0)) {
            require(bountyToken.transfer(bounty.poster, bounty.rewardAmount), "AutoBountyManager: Refund failed");
        }
        
        emit BountyClosed(bountyId);
    }

    function getActiveBounties() public view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active bounties
        for (uint256 i = 1; i < _nextBountyId; i++) {
            if (bounties[i].isActive && block.timestamp <= bounties[i].deadline) {
                activeCount++;
            }
        }
        
        // Collect active bounty IDs
        uint256[] memory activeBountyIds = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i < _nextBountyId; i++) {
            if (bounties[i].isActive && block.timestamp <= bounties[i].deadline) {
                activeBountyIds[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return activeBountyIds;
    }

    function getBountySubmissions(uint256 bountyId) public view returns (address[] memory) {
        return bounties[bountyId].submissions;
    }

    function _authorizeUpgrade(address newImplementation) internal onlyOwner override {}
}

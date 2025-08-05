// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./AuditEngine.sol";
import "./AuditNFT.sol";
import "./AuditRegistry.sol";
import "./BountyToken.sol";

/// @title AutoBountyManager
/// @notice This contract manages the lifecycle of automated bounties, from creation to submission and reward distribution.
/// @custom:security-contact security@codebounty.ai
contract AutoBountyManager is OwnableUpgradeable, UUPSUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _bountyIdCounter;
    CountersUpgradeable.Counter private _submissionIdCounter;

    // --- State Variables ---
    address public auditEngineAddress;
    address public auditNFTAddress;
    address public auditRegistryAddress;
    address public bountyTokenAddress;

    // Platform fee in basis points (e.g., 100 = 1%)
    uint256 public platformFeeBps; // Max 10000 (100%)

    enum BountyStatus {
        Open,
        Closed,
        InProgress // For bounties under review/audit
    }

    struct Bounty {
        uint256 id;
        address indexed owner; // The address that posted the bounty
        string title;
        string description;
        uint256 rewardAmount;
        address rewardToken; // Address of the ERC20 token used for reward
        uint256 dueDate; // Unix timestamp
        string codeHash; // Hash of the code to be audited
        BountyStatus status;
        uint256[] submissionIds; // List of submission IDs for this bounty
    }

    struct Submission {
        uint256 id;
        uint256 indexed bountyId;
        address indexed hunter; // The address that submitted the solution
        string solutionHash; // Hash of the hunter's solution/proof
        string auditReportLink; // Link to external audit report (optional)
        uint256 submissionTime;
        bool approved;
        bool rejected;
        uint256 auditReportId; // Reference to AuditRegistry report
        uint256 auditNFTId; // Reference to AuditNFT
    }

    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Submission) public submissions; // Global submission ID to Submission struct

    // --- Events ---
    event BountyCreated(
        uint256 indexed bountyId,
        address indexed owner,
        string title,
        uint256 rewardAmount,
        address rewardToken,
        uint256 dueDate,
        string codeHash
    );
    event BountyStatusUpdated(uint256 indexed bountyId, BountyStatus newStatus);
    event SubmissionReceived(
        uint256 indexed submissionId,
        uint256 indexed bountyId,
        address indexed hunter,
        string solutionHash
    );
    event SubmissionApproved(
        uint256 indexed submissionId,
        uint256 indexed bountyId,
        address indexed hunter,
        uint256 rewardAmount,
        uint256 auditNFTId
    );
    event SubmissionRejected(uint256 indexed submissionId, uint256 indexed bountyId, address indexed hunter);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event AuditEngineAddressUpdated(address oldAddress, address newAddress);
    event AuditNFTAddressUpdated(address oldAddress, address newAddress);
    event AuditRegistryAddressUpdated(address oldAddress, address newAddress);
    event BountyTokenAddressUpdated(address oldAddress, address newAddress);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _auditEngineAddress,
        address _auditNFTAddress,
        address _auditRegistryAddress,
        address _bountyTokenAddress,
        uint256 _platformFeeBps
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        require(_auditEngineAddress != address(0), "Invalid AuditEngine address");
        require(_auditNFTAddress != address(0), "Invalid AuditNFT address");
        require(_auditRegistryAddress != address(0), "Invalid AuditRegistry address");
        require(_bountyTokenAddress != address(0), "Invalid BountyToken address");
        require(_platformFeeBps <= 10000, "Fee cannot exceed 100%");

        auditEngineAddress = _auditEngineAddress;
        auditNFTAddress = _auditNFTAddress;
        auditRegistryAddress = _auditRegistryAddress;
        bountyTokenAddress = _bountyTokenAddress;
        platformFeeBps = _platformFeeBps;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Admin Functions ---
    function setAuditEngineAddress(address _newAddress) public onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        emit AuditEngineAddressUpdated(auditEngineAddress, _newAddress);
        auditEngineAddress = _newAddress;
    }

    function setAuditNFTAddress(address _newAddress) public onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        emit AuditNFTAddressUpdated(auditNFTAddress, _newAddress);
        auditNFTAddress = _newAddress;
    }

    function setAuditRegistryAddress(address _newAddress) public onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        emit AuditRegistryAddressUpdated(auditRegistryAddress, _newAddress);
        auditRegistryAddress = _newAddress;
    }

    function setBountyTokenAddress(address _newAddress) public onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        emit BountyTokenAddressUpdated(bountyTokenAddress, _newAddress);
        bountyTokenAddress = _newAddress;
    }

    function setPlatformFee(uint256 _newFeeBps) public onlyOwner {
        require(_newFeeBps <= 10000, "Fee cannot exceed 100%");
        emit PlatformFeeUpdated(platformFeeBps, _newFeeBps);
        platformFeeBps = _newFeeBps;
    }

    // --- Bounty Management ---
    /// @notice Creates a new bounty.
    /// @param _title The title of the bounty.
    /// @param _description The description of the bounty.
    /// @param _rewardAmount The amount of reward tokens.
    /// @param _rewardToken The address of the ERC20 reward token.
    /// @param _dueDate Unix timestamp when the bounty expires.
    /// @param _codeHash Hash of the code to be audited.
    function createBounty(
        string memory _title,
        string memory _description,
        uint256 _rewardAmount,
        address _rewardToken,
        uint256 _dueDate,
        string memory _codeHash
    ) public {
        require(_rewardAmount > 0, "Reward must be greater than 0");
        require(_dueDate > block.timestamp, "Due date must be in the future");
        require(bytes(_codeHash).length > 0, "Code hash cannot be empty");

        // Transfer reward tokens from bounty owner to this contract
        IERC20Upgradeable rewardTokenContract = IERC20Upgradeable(_rewardToken);
        require(
            rewardTokenContract.transferFrom(msg.sender, address(this), _rewardAmount),
            "Token transfer failed"
        );

        _bountyIdCounter.increment();
        uint256 currentBountyId = _bountyIdCounter.current();

        bounties[currentBountyId] = Bounty({
            id: currentBountyId,
            owner: msg.sender,
            title: _title,
            description: _description,
            rewardAmount: _rewardAmount,
            rewardToken: _rewardToken,
            dueDate: _dueDate,
            codeHash: _codeHash,
            status: BountyStatus.Open,
            submissionIds: new uint256[](0)
        });

        emit BountyCreated(
            currentBountyId,
            msg.sender,
            _title,
            _rewardAmount,
            _rewardToken,
            _dueDate,
            _codeHash
        );
    }

    /// @notice Allows a hunter to submit a solution for an open bounty.
    /// @param _bountyId The ID of the bounty.
    /// @param _solutionHash Hash of the hunter's solution/proof.
    /// @param _auditReportLink Link to an external audit report (optional).
    function submitBountySolution(
        uint256 _bountyId,
        string memory _solutionHash,
        string memory _auditReportLink
    ) public {
        Bounty storage bounty = bounties[_bountyId];
        require(bounty.owner != address(0), "Bounty does not exist");
        require(bounty.status == BountyStatus.Open, "Bounty is not open for submissions");
        require(block.timestamp <= bounty.dueDate, "Bounty has expired");
        require(bytes(_solutionHash).length > 0, "Solution hash cannot be empty");

        _submissionIdCounter.increment();
        uint256 currentSubmissionId = _submissionIdCounter.current();

        submissions[currentSubmissionId] = Submission({
            id: currentSubmissionId,
            bountyId: _bountyId,
            hunter: msg.sender,
            solutionHash: _solutionHash,
            auditReportLink: _auditReportLink,
            submissionTime: block.timestamp,
            approved: false,
            rejected: false,
            auditReportId: 0,
            auditNFTId: 0
        });

        bounty.submissionIds.push(currentSubmissionId);

        emit SubmissionReceived(currentSubmissionId, _bountyId, msg.sender, _solutionHash);
    }

    /// @notice Approves a submission, distributes reward, and mints an Audit NFT.
    /// @dev Only the bounty owner or a trusted auditor can call this.
    /// @param _bountyId The ID of the bounty.
    /// @param _submissionId The ID of the submission to approve.
    /// @param _auditScore The score from the AI audit (0-100).
    /// @param _vulnerabilities The list of vulnerabilities found by the AI.
    /// @param _auditNFTURI The URI for the Audit NFT.
    function approveSubmission(
        uint256 _bountyId,
        uint256 _submissionId,
        uint256 _auditScore,
        string[] memory _vulnerabilities,
        string memory _auditNFTURI
    ) public {
        Bounty storage bounty = bounties[_bountyId];
        require(bounty.owner != address(0), "Bounty does not exist");
        require(msg.sender == bounty.owner, "Only bounty owner can approve submissions"); // For now, only owner
        require(bounty.status != BountyStatus.Closed, "Bounty is already closed");

        Submission storage submission = submissions[_submissionId];
        require(submission.bountyId == _bountyId, "Submission does not belong to this bounty");
        require(!submission.approved && !submission.rejected, "Submission already processed");

        // Mark bounty as closed
        bounty.status = BountyStatus.Closed;
        emit BountyStatusUpdated(_bountyId, BountyStatus.Closed);

        // Calculate platform fee
        uint256 feeAmount = (bounty.rewardAmount * platformFeeBps) / 10000;
        uint256 hunterReward = bounty.rewardAmount - feeAmount;

        // Transfer reward to hunter
        IERC20Upgradeable rewardTokenContract = IERC20Upgradeable(bounty.rewardToken);
        require(
            rewardTokenContract.transfer(submission.hunter, hunterReward),
            "Reward transfer failed"
        );

        // Transfer fee to platform owner (this contract's owner)
        if (feeAmount > 0) {
            require(
                rewardTokenContract.transfer(owner(), feeAmount),
                "Fee transfer failed"
            );
        }

        // Mint Audit NFT
        AuditNFT auditNFTContract = AuditNFT(auditNFTAddress);
        uint256 nftTokenId = auditNFTContract.mintNFT(submission.hunter, _auditNFTURI);

        // Register Audit Report
        AuditRegistry auditRegistryContract = AuditRegistry(auditRegistryAddress);
        uint224 auditReportId = uint224(auditRegistryContract.registerAuditReport(
            0, // No direct AuditEngine ID for this path
            submission.hunter,
            bounty.codeHash,
            _auditScore,
            _vulnerabilities,
            nftTokenId,
            _auditNFTURI
        ));

        // Update submission status
        submission.approved = true;
        submission.auditReportId = auditReportId;
        submission.auditNFTId = nftTokenId;

        emit SubmissionApproved(_submissionId, _bountyId, submission.hunter, hunterReward, nftTokenId);
    }

    /// @notice Rejects a submission.
    /// @dev Only the bounty owner or a trusted auditor can call this.
    /// @param _bountyId The ID of the bounty.
    /// @param _submissionId The ID of the submission to reject.
    function rejectSubmission(uint256 _bountyId, uint256 _submissionId) public {
        Bounty storage bounty = bounties[_bountyId];
        require(bounty.owner != address(0), "Bounty does not exist");
        require(msg.sender == bounty.owner, "Only bounty owner can reject submissions"); // For now, only owner
        require(bounty.status != BountyStatus.Closed, "Bounty is already closed");

        Submission storage submission = submissions[_submissionId];
        require(submission.bountyId == _bountyId, "Submission does not belong to this bounty");
        require(!submission.approved && !submission.rejected, "Submission already processed");

        submission.rejected = true;

        // If this is the last pending submission, consider closing the bounty or allowing owner to re-open
        // For simplicity, we don't automatically close the bounty here. Owner can manually close.

        emit SubmissionRejected(_submissionId, _bountyId, submission.hunter);
    }

    /// @notice Allows the bounty owner to close an open bounty without approving a submission.
    /// @param _bountyId The ID of the bounty to close.
    function closeBounty(uint256 _bountyId) public {
        Bounty storage bounty = bounties[_bountyId];
        require(bounty.owner != address(0), "Bounty does not exist");
        require(msg.sender == bounty.owner, "Only bounty owner can close bounty");
        require(bounty.status == BountyStatus.Open, "Bounty is not open");

        bounty.status = BountyStatus.Closed;
        emit BountyStatusUpdated(_bountyId, BountyStatus.Closed);

        // Optionally, allow owner to withdraw remaining funds if no submission was approved
        // For simplicity, funds remain in contract for now.
    }

    // --- View Functions ---
    function getBounty(uint256 _bountyId) public view returns (Bounty memory) {
        return bounties[_bountyId];
    }

    function getSubmission(uint256 _submissionId) public view returns (Submission memory) {
        return submissions[_submissionId];
    }

    function getBountySubmissions(uint256 _bountyId) public view returns (Submission[] memory) {
        Bounty storage bounty = bounties[_bountyId];
        require(bounty.owner != address(0), "Bounty does not exist");

        Submission[] memory bountySubmissions = new Submission[](bounty.submissionIds.length);
        for (uint256 i = 0; i < bounty.submissionIds.length; i++) {
            bountySubmissions[i] = submissions[bounty.submissionIds[i]];
        }
        return bountySubmissions;
    }
}

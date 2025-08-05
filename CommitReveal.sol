// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title CommitReveal
/// @notice This contract implements a simple commit-reveal scheme.
/// @dev Useful for preventing front-running in certain scenarios, e.g., bounty submissions.
/// @custom:security-contact security@codebounty.ai
contract CommitReveal is OwnableUpgradeable, UUPSUpgradeable {
    // Mapping from committer address to their commitment hash
    mapping(address => bytes32) public commitments;
    // Mapping from committer address to the block number when they committed
    mapping(address => uint256) public commitBlock;
    // Mapping from committer address to true if they have revealed
    mapping(address => bool) public hasRevealed;

    // Configuration for the reveal phase
    uint256 public revealPeriodBlocks; // Number of blocks after commit when reveal is allowed

    // Events
    event Committed(address indexed committer, bytes32 commitment, uint256 commitBlockNumber);
    event Revealed(address indexed committer, string revealedValue);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 _revealPeriodBlocks) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        require(_revealPeriodBlocks > 0, "Reveal period must be greater than 0");
        revealPeriodBlocks = _revealPeriodBlocks;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Sets the duration of the reveal phase in blocks.
    /// @param _newRevealPeriodBlocks The new number of blocks for the reveal period.
    function setRevealPeriodBlocks(uint256 _newRevealPeriodBlocks) public onlyOwner {
        require(_newRevealPeriodBlocks > 0, "Reveal period must be greater than 0");
        revealPeriodBlocks = _newRevealPeriodBlocks;
    }

    /// @notice Allows a user to commit a hashed value.
    /// @dev The commitment is a hash of the actual value and a random salt.
    /// @param _commitment The keccak256 hash of (value + salt).
    function commit(bytes32 _commitment) public {
        require(commitments[msg.sender] == bytes32(0), "Already committed");
        require(!hasRevealed[msg.sender], "Already revealed");

        commitments[msg.sender] = _commitment;
        commitBlock[msg.sender] = block.number;

        emit Committed(msg.sender, _commitment, block.number);
    }

    /// @notice Allows a user to reveal their committed value.
    /// @dev The reveal must happen within the specified reveal period after the commit.
    /// @param _value The actual value that was committed.
    /// @param _salt The salt used to create the commitment.
    function reveal(string memory _value, string memory _salt) public {
        require(commitments[msg.sender] != bytes32(0), "No commitment found");
        require(!hasRevealed[msg.sender], "Already revealed");

        // Check if current block is within the reveal period
        require(
            block.number > commitBlock[msg.sender],
            "Reveal period has not started yet"
        );
        require(
            block.number <= commitBlock[msg.sender] + revealPeriodBlocks,
            "Reveal period has ended"
        );

        // Verify the revealed value against the commitment
        bytes32 expectedCommitment = keccak256(abi.encodePacked(_value, _salt));
        require(commitments[msg.sender] == expectedCommitment, "Invalid reveal: commitment mismatch");

        hasRevealed[msg.sender] = true;
        // Optionally, clear the commitment after successful reveal to allow new commits
        // commitments[msg.sender] = bytes32(0);
        // commitBlock[msg.sender] = 0;

        emit Revealed(msg.sender, _value);
    }

    /// @notice Checks if a user has an active commitment.
    /// @param _committer The address of the committer.
    /// @return True if the committer has an active commitment, false otherwise.
    function hasCommitted(address _committer) public view returns (bool) {
        return commitments[_committer] != bytes32(0) && !hasRevealed[_committer];
    }

    /// @notice Checks if a user is currently in the reveal phase.
    /// @param _committer The address of the committer.
    /// @return True if the committer is in the reveal phase, false otherwise.
    function isInRevealPhase(address _committer) public view returns (bool) {
        uint256 cBlock = commitBlock[_committer];
        return cBlock != 0 && block.number > cBlock && block.number <= cBlock + revealPeriodBlocks;
    }
}

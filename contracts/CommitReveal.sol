// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract CommitReveal is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    struct Commit {
        bytes32 commitHash;
        uint256 timestamp;
        bool revealed;
        string revealedValue;
    }

    // bountyId => hunter => Commit
    mapping(uint256 => mapping(address => Commit)) public commits;
    
    uint256 public REVEAL_PERIOD; // Time window for reveals after commit phase ends

    event Committed(uint256 indexed bountyId, address indexed hunter, bytes32 commitHash);
    event Revealed(uint256 indexed bountyId, address indexed hunter, string value);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 revealPeriod) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        
        REVEAL_PERIOD = revealPeriod;
    }

    function commit(uint256 bountyId, bytes32 commitHash) public {
        require(commits[bountyId][msg.sender].commitHash == 0, "CommitReveal: Already committed");
        
        commits[bountyId][msg.sender] = Commit({
            commitHash: commitHash,
            timestamp: block.timestamp,
            revealed: false,
            revealedValue: ""
        });
        
        emit Committed(bountyId, msg.sender, commitHash);
    }

    function reveal(uint256 bountyId, string memory value, string memory nonce) public {
        Commit storage userCommit = commits[bountyId][msg.sender];
        require(userCommit.commitHash != 0, "CommitReveal: No commit found");
        require(!userCommit.revealed, "CommitReveal: Already revealed");
        
        bytes32 expectedHash = keccak256(abi.encodePacked(value, nonce));
        require(userCommit.commitHash == expectedHash, "CommitReveal: Invalid reveal");
        
        userCommit.revealed = true;
        userCommit.revealedValue = value;
        
        emit Revealed(bountyId, msg.sender, value);
    }

    function getCommit(uint256 bountyId, address hunter) public view returns (Commit memory) {
        return commits[bountyId][hunter];
    }

    function hasCommitted(uint256 bountyId, address hunter) public view returns (bool) {
        return commits[bountyId][hunter].commitHash != 0;
    }

    function hasRevealed(uint256 bountyId, address hunter) public view returns (bool) {
        return commits[bountyId][hunter].revealed;
    }

    function setRevealPeriod(uint256 newPeriod) public onlyOwner {
        REVEAL_PERIOD = newPeriod;
    }

    function _authorizeUpgrade(address newImplementation) internal onlyOwner override {}
}

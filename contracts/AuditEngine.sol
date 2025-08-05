// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract AuditEngine is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    uint256 public CONCURRENCY_LEVEL;
    uint256 private _nextAuditId;
    
    // Track active audits for concurrency control
    mapping(uint256 => bool) public activeAudits;
    uint256 public currentActiveAudits;

    event AuditRequested(
        uint256 indexed auditId, 
        address indexed requester, 
        string sourceCid,
        uint256 timestamp
    );
    
    event AuditCompleted(
        uint256 indexed auditId, 
        uint256 score, 
        string reportCid
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 concurrencyLevel) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        
        CONCURRENCY_LEVEL = concurrencyLevel;
        _nextAuditId = 1;
    }

    function scanContract(string memory sourceCid) public returns (uint256 auditId) {
        require(currentActiveAudits < CONCURRENCY_LEVEL, "AuditEngine: Concurrency limit reached");
        
        auditId = _nextAuditId++;
        activeAudits[auditId] = true;
        currentActiveAudits++;
        
        emit AuditRequested(auditId, msg.sender, sourceCid, block.timestamp);
        return auditId;
    }

    function completeAudit(
        uint256 auditId, 
        uint256 score, 
        string memory reportCid
    ) public onlyOwner {
        require(activeAudits[auditId], "AuditEngine: Audit not active");
        
        activeAudits[auditId] = false;
        currentActiveAudits--;
        
        emit AuditCompleted(auditId, score, reportCid);
    }

    function setConcurrencyLevel(uint256 newLevel) public onlyOwner {
        CONCURRENCY_LEVEL = newLevel;
    }

    function _authorizeUpgrade(address newImplementation) internal onlyOwner override {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./AutoBountyManager.sol";

contract AuditRegistry is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    struct Audit {
        uint256 id;
        address requester;
        string sourceCid;
        uint256 score;
        string reportCid;
        uint256 timestamp;
        bool completed;
        string[] issueIds;
    }

    mapping(uint256 => Audit) public audits;
    uint256 private _nextAuditId;
    
    // Configuration parameters
    uint256 public HIGH_RISK_THRESHOLD;
    uint256 public MIN_QUALITY_SCORE;
    bool public autoBountyEnabled;
    uint256 public defaultRewardPerIssue;
    
    AutoBountyManager public bountyManager;

    event AuditRegistered(uint256 indexed auditId, address indexed requester, string sourceCid);
    event AuditCompleted(uint256 indexed auditId, uint256 score, string reportCid, string[] issueIds);
    event AutoBountyTriggered(uint256 indexed auditId, uint256 bountyCount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        uint256 highRiskThreshold,
        uint256 minQualityScore,
        uint256 defaultReward,
        address bountyManagerAddress
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        
        HIGH_RISK_THRESHOLD = highRiskThreshold;
        MIN_QUALITY_SCORE = minQualityScore;
        defaultRewardPerIssue = defaultReward;
        autoBountyEnabled = true;
        bountyManager = AutoBountyManager(bountyManagerAddress);
        _nextAuditId = 1;
    }

    function registerAudit(address requester, string memory sourceCid) public onlyOwner returns (uint256) {
        uint256 auditId = _nextAuditId++;
        audits[auditId] = Audit({
            id: auditId,
            requester: requester,
            sourceCid: sourceCid,
            score: 0,
            reportCid: "",
            timestamp: block.timestamp,
            completed: false,
            issueIds: new string[](0)
        });
        
        emit AuditRegistered(auditId, requester, sourceCid);
        return auditId;
    }

    function onAuditCompleted(
        uint256 auditId, 
        uint256 score, 
        string memory reportCid,
        string[] memory issueIds
    ) public onlyOwner {
        require(audits[auditId].id != 0, "AuditRegistry: Audit does not exist");
        
        audits[auditId].score = score;
        audits[auditId].reportCid = reportCid;
        audits[auditId].completed = true;
        audits[auditId].issueIds = issueIds;
        
        emit AuditCompleted(auditId, score, reportCid, issueIds);
        
        // Auto-bounty logic
        if (score >= HIGH_RISK_THRESHOLD && autoBountyEnabled && issueIds.length > 0) {
            uint256[] memory rewards = new uint256[](issueIds.length);
            for (uint256 i = 0; i < issueIds.length; i++) {
                rewards[i] = defaultRewardPerIssue;
            }
            
            bountyManager.createBounties(auditId, issueIds, rewards);
            emit AutoBountyTriggered(auditId, issueIds.length);
        }
    }

    function getAudit(uint256 auditId) public view returns (Audit memory) {
        return audits[auditId];
    }

    function setParameters(
        uint256 highRiskThreshold,
        uint256 minQualityScore,
        uint256 defaultReward,
        bool autoEnabled
    ) public onlyOwner {
        HIGH_RISK_THRESHOLD = highRiskThreshold;
        MIN_QUALITY_SCORE = minQualityScore;
        defaultRewardPerIssue = defaultReward;
        autoBountyEnabled = autoEnabled;
    }

    function setBountyManager(address bountyManagerAddress) public onlyOwner {
        bountyManager = AutoBountyManager(bountyManagerAddress);
    }

    function _authorizeUpgrade(address newImplementation) internal onlyOwner override {}
}

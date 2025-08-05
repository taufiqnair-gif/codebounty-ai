// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract PatchAssessor is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    struct Assessment {
        uint8 score;
        string feedback;
        bool assessed;
        uint256 timestamp;
    }
    
    mapping(uint256 => Assessment) public assessments; // bountyId => Assessment
    uint256 public MIN_QUALITY_SCORE;
    
    event PatchAssessed(uint256 indexed bountyId, address indexed hunter, uint8 score, string feedback);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 minQualityScore) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        
        MIN_QUALITY_SCORE = minQualityScore;
    }

    function assessPatchQuality(
        uint256 bountyId, 
        string memory evidenceCid
    ) public onlyOwner returns (uint8 score, string memory feedback) {
        // In a real implementation, this would integrate with AI assessment
        // For now, we'll simulate the assessment
        
        // Simple heuristic based on evidence CID length and content
        bytes memory evidenceBytes = bytes(evidenceCid);
        
        if (evidenceBytes.length < 10) {
            score = 30;
            feedback = "Insufficient evidence provided";
        } else if (evidenceBytes.length < 50) {
            score = 60;
            feedback = "Basic patch provided, needs improvement";
        } else {
            score = 85;
            feedback = "Comprehensive patch with good documentation";
        }
        
        assessments[bountyId] = Assessment({
            score: score,
            feedback: feedback,
            assessed: true,
            timestamp: block.timestamp
        });
        
        emit PatchAssessed(bountyId, msg.sender, score, feedback);
        return (score, feedback);
    }

    function getAssessment(uint256 bountyId) public view returns (Assessment memory) {
        return assessments[bountyId];
    }

    function setMinQualityScore(uint256 newScore) public onlyOwner {
        MIN_QUALITY_SCORE = newScore;
    }

    function _authorizeUpgrade(address newImplementation) internal onlyOwner override {}
}

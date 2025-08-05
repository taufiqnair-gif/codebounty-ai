// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

/// @title AuditEngine
/// @notice This contract simulates an AI audit engine. In a real scenario, this would interact with an off-chain AI service.
/// @custom:security-contact security@codebounty.ai
contract AuditEngine is OwnableUpgradeable, UUPSUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _auditIdCounter;

    // Struct to store audit results
    struct AuditResult {
        address auditor; // Address that requested the audit (e.g., AutoBountyManager)
        string codeHash; // Hash of the code that was audited
        uint256 score; // Audit score (e.g., 0-100)
        string[] vulnerabilities; // List of detected vulnerabilities
        bool completed; // True if audit result is available
    }

    mapping(uint256 => AuditResult) public auditResults;

    // Events
    event AuditRequested(uint256 indexed auditId, address indexed requester, string codeHash);
    event AuditCompleted(uint256 indexed auditId, uint256 score, string[] vulnerabilities);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Requests an AI audit for a given code hash.
    /// @dev This function would typically trigger an off-chain AI service via an oracle or similar mechanism.
    /// @param _codeHash A hash representing the code to be audited.
    /// @return auditId The unique ID assigned to this audit request.
    function requestAudit(string memory _codeHash) public returns (uint256) {
        _auditIdCounter.increment();
        uint256 currentAuditId = _auditIdCounter.current();

        auditResults[currentAuditId] = AuditResult({
            auditor: msg.sender, // The entity requesting the audit
            codeHash: _codeHash,
            score: 0,
            vulnerabilities: new string[](0),
            completed: false
        });

        emit AuditRequested(currentAuditId, msg.sender, _codeHash);
        return currentAuditId;
    }

    /// @notice Sets the result of a previously requested audit.
    /// @dev This function should only be callable by a trusted oracle or the owner, representing the AI service.
    /// @param _auditId The ID of the audit request.
    /// @param _score The security score given by the AI.
    /// @param _vulnerabilities An array of strings describing the vulnerabilities found.
    function setAuditResult(
        uint256 _auditId,
        uint256 _score,
        string[] memory _vulnerabilities
    ) public onlyOwner { // Only owner can set results for this mock
        require(auditResults[_auditId].auditor != address(0), "Audit does not exist");
        require(!auditResults[_auditId].completed, "Audit already completed");

        AuditResult storage result = auditResults[_auditId];
        result.score = _score;
        result.vulnerabilities = _vulnerabilities;
        result.completed = true;

        emit AuditCompleted(_auditId, _score, _vulnerabilities);
    }

    /// @notice Retrieves the details of a completed audit.
    /// @param _auditId The ID of the audit.
    /// @return auditor The address that requested the audit.
    /// @return codeHash The hash of the audited code.
    /// @return score The security score.
    /// @return vulnerabilities The list of vulnerabilities.
    /// @return completed Whether the audit is completed.
    function getAuditDetails(uint256 _auditId)
        public
        view
        returns (
            address auditor,
            string memory codeHash,
            uint256 score,
            string[] memory vulnerabilities,
            bool completed
        )
    {
        AuditResult storage result = auditResults[_auditId];
        return (result.auditor, result.codeHash, result.score, result.vulnerabilities, result.completed);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

/// @title AuditRegistry
/// @notice This contract serves as a registry for completed audit reports and their associated NFTs.
/// @custom:security-contact security@codebounty.ai
contract AuditRegistry is OwnableUpgradeable, UUPSUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _reportIdCounter;

    struct AuditReport {
        uint256 auditId; // Reference to the audit in AuditEngine (if applicable)
        address indexed auditor; // Address of the auditor (human or AI service)
        string codeHash; // Hash of the audited code
        uint256 score; // Security score
        string[] vulnerabilities; // List of vulnerabilities
        uint256 nftTokenId; // ID of the associated AuditNFT
        string nftTokenURI; // URI of the associated AuditNFT
        uint256 timestamp; // When the report was registered
    }

    mapping(uint256 => AuditReport) public auditReports; // reportId => AuditReport
    mapping(uint256 => uint256) public nftToReportId; // nftTokenId => reportId

    event AuditReportRegistered(
        uint256 indexed reportId,
        address indexed auditor,
        uint256 indexed nftTokenId,
        uint256 score,
        string codeHash
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Registers a new audit report and links it to an Audit NFT.
    /// @dev This function is expected to be called by a trusted entity, e.g., AutoBountyManager or the AuditEngine itself.
    /// @param _auditId The ID from the AuditEngine (if applicable, 0 if not from engine).
    /// @param _auditor The address of the auditor.
    /// @param _codeHash The hash of the audited code.
    /// @param _score The security score.
    /// @param _vulnerabilities The list of vulnerabilities.
    /// @param _nftTokenId The ID of the minted AuditNFT.
    /// @param _nftTokenURI The URI of the minted AuditNFT.
    /// @return reportId The unique ID of the registered audit report.
    function registerAuditReport(
        uint256 _auditId,
        address _auditor,
        string memory _codeHash,
        uint256 _score,
        string[] memory _vulnerabilities,
        uint256 _nftTokenId,
        string memory _nftTokenURI
    ) public onlyOwner returns (uint256) { // Only owner can register for this mock
        _reportIdCounter.increment();
        uint256 currentReportId = _reportIdCounter.current();

        auditReports[currentReportId] = AuditReport({
            auditId: _auditId,
            auditor: _auditor,
            codeHash: _codeHash,
            score: _score,
            vulnerabilities: _vulnerabilities,
            nftTokenId: _nftTokenId,
            nftTokenURI: _nftTokenURI,
            timestamp: block.timestamp
        });

        nftToReportId[_nftTokenId] = currentReportId;

        emit AuditReportRegistered(currentReportId, _auditor, _nftTokenId, _score, _codeHash);
        return currentReportId;
    }

    /// @notice Retrieves an audit report by its unique ID.
    /// @param _reportId The ID of the audit report.
    /// @return report The AuditReport struct.
    function getAuditReport(uint256 _reportId) public view returns (AuditReport memory) {
        return auditReports[_reportId];
    }

    /// @notice Retrieves an audit report by its associated NFT Token ID.
    /// @param _nftTokenId The ID of the Audit NFT.
    /// @return report The AuditReport struct.
    function getAuditReportByNFT(uint256 _nftTokenId) public view returns (AuditReport memory) {
        uint256 reportId = nftToReportId[_nftTokenId];
        require(reportId != 0, "No report found for this NFT ID");
        return auditReports[reportId];
    }
}

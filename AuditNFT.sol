// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

/**
 * @title AuditNFT
 * @dev Soulbound NFT for recording auditor/hunter reputation and achievements
 * @notice Non-transferable NFTs that represent audit completion and quality scores
 */
contract AuditNFT is 
    ERC721Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;

    struct AuditRecord {
        uint256 auditId;
        address hunter;
        uint256 qualityScore;
        uint256 xpEarned;
        uint256 issuesFixed;
        string contractAddress;
        string metadataUri;
        uint256 timestamp;
    }

    /// @dev Mapping from token ID to audit record
    mapping(uint256 => AuditRecord) public auditRecords;
    
    /// @dev Mapping from hunter to their token IDs
    mapping(address => uint256[]) public hunterTokens;

    /// @dev Mapping from hunter to total XP earned
    mapping(address => uint256) public hunterXP;

    event AuditNFTMinted(
        uint256 indexed tokenId,
        address indexed hunter,
        uint256 indexed auditId,
        uint256 qualityScore,
        uint256 xpEarned
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract
     * @param name_ Name of the NFT
     * @param symbol_ Symbol of the NFT
     */
    function initialize(string memory name_, string memory symbol_) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Mint audit NFT to hunter
     * @param hunter Address of the hunter
     * @param auditId ID of the completed audit
     * @param qualityScore AI-assessed quality score (0-100)
     * @param xpEarned Experience points earned
     * @param issuesFixed Number of issues fixed
     * @param contractAddress Address of audited contract
     * @param metadataUri IPFS URI containing audit details
     */
    function mintAuditNFT(
        address hunter,
        uint256 auditId,
        uint256 qualityScore,
        uint256 xpEarned,
        uint256 issuesFixed,
        string memory contractAddress,
        string memory metadataUri
    ) public onlyOwner returns (uint256) {
        require(hunter != address(0), "AuditNFT: Invalid hunter address");
        require(qualityScore <= 100, "AuditNFT: Invalid quality score");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Store audit record
        auditRecords[tokenId] = AuditRecord({
            auditId: auditId,
            hunter: hunter,
            qualityScore: qualityScore,
            xpEarned: xpEarned,
            issuesFixed: issuesFixed,
            contractAddress: contractAddress,
            metadataUri: metadataUri,
            timestamp: block.timestamp
        });

        // Update hunter's tokens and XP
        hunterTokens[hunter].push(tokenId);
        hunterXP[hunter] += xpEarned;

        // Mint the NFT
        _mint(hunter, tokenId);
        _setTokenURI(tokenId, metadataUri);

        emit AuditNFTMinted(tokenId, hunter, auditId, qualityScore, xpEarned);

        return tokenId;
    }

    /**
     * @dev Get hunter's total XP
     * @param hunter Address of the hunter
     */
    function getHunterXP(address hunter) external view returns (uint256) {
        return hunterXP[hunter];
    }

    /**
     * @dev Get hunter's NFT token IDs
     * @param hunter Address of the hunter
     */
    function getHunterTokens(address hunter) external view returns (uint256[] memory) {
        return hunterTokens[hunter];
    }

    /**
     * @dev Get audit record by token ID
     * @param tokenId Token ID to query
     */
    function getAuditRecord(uint256 tokenId) external view returns (AuditRecord memory) {
        require(_exists(tokenId), "AuditNFT: Token does not exist");
        return auditRecords[tokenId];
    }

    /**
     * @dev Override tokenURI to return metadata from IPFS
     * @param tokenId Token ID to get URI for
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "AuditNFT: URI query for nonexistent token");
        return auditRecords[tokenId].metadataUri;
    }

    /**
     * @dev Override transfer functions to make NFT soulbound (non-transferable)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        require(from == address(0), "AuditNFT: Soulbound token cannot be transferred");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Authorize upgrade (UUPS pattern)
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyOwner 
    {}

    // Optional: Allow burning NFTs
    function burnNFT(uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _burn(tokenId);
    }

    /**
     * @dev Override supportsInterface for AccessControl
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}

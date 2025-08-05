// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

contract AuditNFT is Initializable, ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    
    CountersUpgradeable.Counter private _tokenIdCounter;
    string private _baseTokenURI;
    
    // Soulbound: mapping to track if transfers are allowed
    mapping(uint256 => bool) private _transferable;
    
    // NFT metadata for reputation tracking
    struct AuditNFTMetadata {
        uint256 auditId;
        uint256 bountyId;
        uint8 qualityScore;
        string evidenceCid;
        uint256 timestamp;
    }
    
    mapping(uint256 => AuditNFTMetadata) public nftMetadata;

    event AuditNFTMinted(uint256 indexed tokenId, address indexed hunter, uint256 indexed bountyId, uint8 qualityScore);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory baseTokenURI) public initializer {
        __ERC721_init("AuditNFT", "ANFT");
        __Ownable_init();
        __UUPSUpgradeable_init();
        
        _baseTokenURI = baseTokenURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function safeMint(
        address to, 
        uint256 auditId,
        uint256 bountyId,
        uint8 qualityScore,
        string memory evidenceCid
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        
        // Store metadata
        nftMetadata[tokenId] = AuditNFTMetadata({
            auditId: auditId,
            bountyId: bountyId,
            qualityScore: qualityScore,
            evidenceCid: evidenceCid,
            timestamp: block.timestamp
        });
        
        // Make soulbound by default
        _transferable[tokenId] = false;
        
        emit AuditNFTMinted(tokenId, to, bountyId, qualityScore);
        return tokenId;
    }

    function setBaseURI(string memory baseTokenURI) public onlyOwner {
        _baseTokenURI = baseTokenURI;
    }

    // Override transfer functions to make soulbound
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // Allow minting (from == address(0)) but prevent transfers
        if (from != address(0)) {
            require(_transferable[tokenId], "AuditNFT: Token is soulbound and cannot be transferred");
        }
    }

    function makeTransferable(uint256 tokenId) public onlyOwner {
        _transferable[tokenId] = true;
    }

    function getHunterNFTs(address hunter) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(hunter);
        uint256[] memory tokenIds = new uint256[](balance);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_exists(i) && ownerOf(i) == hunter) {
                tokenIds[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return tokenIds;
    }

    function _authorizeUpgrade(address newImplementation) internal onlyOwner override {}
}

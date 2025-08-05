// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @custom:security-contact security@codebounty.ai
contract BountyToken is ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory name_, string memory symbol_) public initializer {
        __ERC20_init(name_, symbol_);
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Function to mint new tokens (only callable by owner)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Function to burn tokens (can be called by anyone to burn their own tokens)
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    // Optional: Pause/Unpause functionality for emergencies
    // import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
    // function pause() public onlyOwner { _pause(); }
    // function unpause() public onlyOwner { _unpause(); }
    // function _beforeTokenTransfer(address from, address to, uint256 amount) internal view override(ERC20Upgradeable, PausableUpgradeable) {
    //     super._beforeTokenTransfer(from, to, amount);
    // }
}

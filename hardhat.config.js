require("@nomicfoundation/hardhat-toolbox")

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      chainId: 31337, // Default Hardhat Network chain ID
    },
    // You can add other networks here, e.g., sepolia, mainnet
    // sepolia: {
    //   url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
    //   accounts: [PRIVATE_KEY]
    // }
  },
  paths: {
    artifacts: "./artifacts",
  },
}

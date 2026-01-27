require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-ignition-ethers");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-chai-matchers");
require("@typechain/hardhat");

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: '0.8.19',
  networks: {
    localhost: {
      type: 'http',
      url: 'http://127.0.0.1:8546',
      chainId: 31337,
    },
    polygonAmoy: {
      type: 'http',
      url: 'https://rpc-amoy.polygon.technology/',
      chainId: 80002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },
};

module.exports = config;
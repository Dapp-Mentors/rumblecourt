require('@nomicfoundation/hardhat-ethers')
require('@nomicfoundation/hardhat-verify')
require('@nomicfoundation/hardhat-chai-matchers')
require('@typechain/hardhat')

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    localhost: {
      type: 'http',
      // Use environment variable to support both local and Docker environments
      url: process.env.RPC_URL || 'http://127.0.0.1:8545',
      chainId: 31337,
      // Add timeout for better reliability in Docker
      timeout: 60000,
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
  // Add paths to ensure artifacts are in the right place
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
}

module.exports = config

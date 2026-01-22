import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";

async function main(): Promise<void> {
  console.log("Deploying SavingsVault...");

  // Get the contract factory
  const SavingsVaultFactory = await hre.ethers.getContractFactory("SavingsVault");

  // Deploy with the initial message
  const savingsVault = await SavingsVaultFactory.deploy("Hello, World!");

  // Wait for the deployment transaction to be mined
  await savingsVault.waitForDeployment();

  // Get the deployed address
  const address = await savingsVault.getAddress();

  console.log(`SavingsVault deployed to: ${address}`);
  console.log(`Initial message: ${await savingsVault.getMessage()}`);

  // Optional: Manual verification on PolygonScan (for Amoy/Mumbai)
  // Run this in terminal after deployment:
  // npx hardhat verify --network polygonAmoy ${address} "Hello, World!"
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
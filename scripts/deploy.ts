import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";

async function main(): Promise<void> {
  console.log("Courtroom System - Deploying Contracts");
  console.log("======================================");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);

  // Deploy VerdictStorage
  console.log("Deploying VerdictStorage...");
  const VerdictStorageFactory = await hre.ethers.getContractFactory("VerdictStorage");
  const verdictStorage = await VerdictStorageFactory.deploy();
  await verdictStorage.waitForDeployment();
  const verdictStorageAddress = await verdictStorage.getAddress();
  console.log(`VerdictStorage deployed to: ${verdictStorageAddress}`);

  // Deploy AdjournmentTracking
  console.log("Deploying AdjournmentTracking...");
  const AdjournmentTrackingFactory = await hre.ethers.getContractFactory("AdjournmentTracking");
  const adjournmentTracking = await AdjournmentTrackingFactory.deploy();
  await adjournmentTracking.waitForDeployment();
  const adjournmentTrackingAddress = await adjournmentTracking.getAddress();
  console.log(`AdjournmentTracking deployed to: ${adjournmentTrackingAddress}`);

  // Setup authorized judges (example)
  console.log("Setting up authorized judges...");
  await verdictStorage.addAuthorizedJudge(deployer.address);
  await adjournmentTracking.addAuthorizedJudge(deployer.address);
  console.log(`Added deployer as authorized judge: ${deployer.address}`);

  console.log("");
  console.log("Deployment Summary:");
  console.log("==================");
  console.log(`VerdictStorage: ${verdictStorageAddress}`);
  console.log(`AdjournmentTracking: ${adjournmentTrackingAddress}`);
  console.log("");
  console.log("Available contracts:");
  console.log("- VerdictStorage (Concrete implementation)");
  console.log("- AdjournmentTracking (Concrete implementation)");
  console.log("- ICaseRecording (Interface - not yet implemented)");
  console.log("");
  console.log("Next steps:");
  console.log("1. Run tests: npx hardhat test");
  console.log("2. Verify contracts on block explorer if needed");
  console.log("3. Update frontend to integrate with deployed contracts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
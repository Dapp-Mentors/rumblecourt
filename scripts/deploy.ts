import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";

async function main(): Promise<void> {
  console.log("<Û  Deploying Courtroom System Contracts");
  console.log("========================================");
  
  // Deploy VerdictStorage contract
  console.log("Deploying VerdictStorage contract...");
  const VerdictStorageFactory = await hre.ethers.getContractFactory("VerdictStorage");
  const verdictStorage = await VerdictStorageFactory.deploy();
  await verdictStorage.waitForDeployment();
  const verdictStorageAddress = await verdictStorage.getAddress();
  console.log(` VerdictStorage deployed to: ${verdictStorageAddress}`);

  // Deploy AdjournmentTracking contract
  console.log("Deploying AdjournmentTracking contract...");
  const AdjournmentTrackingFactory = await hre.ethers.getContractFactory("AdjournmentTracking");
  const adjournmentTracking = await AdjournmentTrackingFactory.deploy();
  await adjournmentTracking.waitForDeployment();
  const adjournmentTrackingAddress = await adjournmentTracking.getAddress();
  console.log(` AdjournmentTracking deployed to: ${adjournmentTrackingAddress}`);

  console.log("");
  console.log("=Ë  Deployment Summary:");
  console.log(`   VerdictStorage: ${verdictStorageAddress}`);
  console.log(`   AdjournmentTracking: ${adjournmentTrackingAddress}`);
  console.log("");
  console.log("=  Contracts are now ready for courtroom simulation!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

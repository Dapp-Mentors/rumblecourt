import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";

async function main(): Promise<void> {
  console.log("Testing CourtroomParticipants deployment...");
  
  // Deploy CourtroomParticipants contract
  console.log("Deploying CourtroomParticipants contract...");
  const CourtroomParticipantsFactory = await hre.ethers.getContractFactory("CourtroomParticipants");
  const courtroomParticipants = await CourtroomParticipantsFactory.deploy();
  await courtroomParticipants.waitForDeployment();
  const courtroomParticipantsAddress = await courtroomParticipants.getAddress();
  console.log(`✅ CourtroomParticipants deployed to: ${courtroomParticipantsAddress}`);

  // Test basic functionality
  const contractOwner = await courtroomParticipants.getContractOwner();
  console.log(`✅ Contract owner: ${contractOwner}`);
  
  console.log("✅ CourtroomParticipants contract deployed and tested successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
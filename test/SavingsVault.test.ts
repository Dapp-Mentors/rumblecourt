import { expect } from "chai";
import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import type { SavingsVault } from "../typechain-types";

describe("SavingsVault", function () {
  let savingsVault: SavingsVault;

  beforeEach(async function () {
    const [owner] = await hre.ethers.getSigners();
    const SavingsVaultFactory = await hre.ethers.getContractFactory("SavingsVault", owner);
    savingsVault = await SavingsVaultFactory.deploy("Hello, World!") as SavingsVault;
    await savingsVault.waitForDeployment();
  });

  it("Should deploy successfully", async function () {
    expect(await savingsVault.getAddress()).to.not.equal(hre.ethers.ZeroAddress);
  });

  it("Should return the initial message", async function () {
    expect(await savingsVault.getMessage()).to.equal("Hello, World!");
  });

  it("Should allow setting a new message", async function () {
    const [owner] = await hre.ethers.getSigners();
    await savingsVault.connect(owner).setMessage("New Message");
    expect(await savingsVault.getMessage()).to.equal("New Message");
  });
});
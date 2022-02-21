// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const questContract = await hre.ethers.getContractFactory("QuestRewards");
  const quest = await questContract.deploy(
    "0x524B969793a64a602342d89BC2789D43a016B13A"
  );
  const createTaskTxn1 = await quest.createTask(
    ethers.utils.parseEther("100"),
    0
  );
  await createTaskTxn1.wait();
  const createTaskTxn2 = await quest.createTask(
    ethers.utils.parseEther("100"),
    1
  );
  await createTaskTxn2.wait();
  const createTaskTxn3 = await quest.createTask(
    ethers.utils.parseEther("100"),
    2
  );
  await createTaskTxn3.wait();
  const createTaskTxn4 = await quest.createTask(
    ethers.utils.parseEther("100"),
    3
  );
  await createTaskTxn4.wait();

  console.log("Quests deployed at ", quest.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

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
  const dummyContract = await hre.ethers.getContractFactory("DummyToken");
  const dummyToken = await dummyContract.deploy("Gnosis", "GNO");
  console.log("Dummy token deployed at ", dummyToken.address);
  const quest = await questContract.deploy(dummyToken.address);
  const txn = await dummyToken.mint(
    ethers.utils.parseEther("10000"),
    quest.address
  );
  await txn.wait();
  const fundSigner = ethers.provider.getSigner(19);
  const fundTxn = await fundSigner.sendTransaction({
    to: "0x4e9606FEA76112BF275fA5764614b5847066694E",
    value: ethers.utils.parseEther("2"),
  });
  const createTaskTxn1 = await quest.createTask(
    ethers.utils.parseEther("300"),
    0
  );
  await createTaskTxn1.wait();
  const rootUpdate1 = await quest.changeMerkleRoot(
    0,
    "0x8a4e3950bbf317e136601d0f71d6a004ad9df7e9f489ccda991efda2236679c7"
  );
  await rootUpdate1.wait();
  const createTaskTxn2 = await quest.createTask(
    ethers.utils.parseEther("500"),
    1
  );
  await createTaskTxn2.wait();
  const rootUpdate2 = await quest.changeMerkleRoot(
    1,
    "0x54c9c696c952197f153bbd79c692e6a84c9ebfc01486bcdbf74efd1acb599b2a"
  );
  await rootUpdate2.wait();
  const createTaskTxn3 = await quest.createTask(
    ethers.utils.parseEther("700"),
    2
  );
  await createTaskTxn3.wait();
  const rootUpdate3 = await quest.changeMerkleRoot(
    2,
    "0x803c4145f8f1f839271cff1c0b64d5afd9f39b78cbdcd5c6072578701ad53133"
  );
  await rootUpdate3.wait();
  const createTaskTxn4 = await quest.createTask(
    ethers.utils.parseEther("900"),
    3
  );
  await createTaskTxn4.wait();
  const rootUpdate4 = await quest.changeMerkleRoot(
    3,
    "0x1f4895a102727392b5f342b95a42950fa3f9a0edafe52fc8bf6f1e69c3c23963"
  );
  await rootUpdate4.wait();

  console.log("Quests deployed at ", quest.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

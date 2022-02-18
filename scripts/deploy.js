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
    "0xe7cd2ffb4be68f521af5699a003fee50e8f6be30b053f6c2322fea962767053c"
  );
  await rootUpdate1.wait();
  const createTaskTxn2 = await quest.createTask(
    ethers.utils.parseEther("500"),
    1
  );
  await createTaskTxn2.wait();
  const rootUpdate2 = await quest.changeMerkleRoot(
    1,
    "0xef757f1ebc5879337a1ffe6377792b52684a24d3c8c01ae958947b9319ac0eaa"
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
    "0x5fb0685af3911aef364c752f69bc1d474fc8f3f78fec565e3a45f7cf2d4438aa"
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

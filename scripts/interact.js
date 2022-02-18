const hre = require("hardhat");
const { ethers } = require("hardhat");
console.clear();
async function main() {
  // Our code will go here
  const quest = await ethers.getContractAt(
    "QuestRewards",
    "0x809d550fca64d94bd9f66e60752a544199cfac3d"
  );
  const rootUpdate1 = await quest.updateMerkleRoot(
    0,
    "0xe7cd2ffb4be68f521af5699a003fee50e8f6be30b053f6c2322fea962767053c"
  );
  await rootUpdate1.wait();
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

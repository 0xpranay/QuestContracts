const hre = require("hardhat");
const { ethers } = require("hardhat");
console.clear();
async function main() {
  // Our code will go here
  const questContract = await ethers.getContractAt(
    "QuestRewards",
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  );
  const tokenAddress = await questContract.defaultRewardToken();
  console.log(tokenAddress);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const { keccak256 } = require("ethers/lib/utils");
const { MerkleTree } = require("merkletreejs");
const hre = require("hardhat");
const { ethers } = require("hardhat");
console.clear();
async function main() {
  //   const accountsTotal = await hre.ethers.getSigners();
  //   const accounts = accountsTotal.slice(0, -2);
  //   const leaves = accounts.map((x) => keccak256(x.address));
  //   const tree = new MerkleTree(leaves, keccak256);
  //   const root = tree.getRoot().toString("hex");
  //   const leaf = keccak256(accounts[3].address);
  //   const proof = tree.getProof(leaf);
  //   console.log(
  //     "-----------------------Printing the Merkle Tree now---------------------"
  //   );
  //   console.log(tree.toString());
  //   console.log(tree.verify(proof, leaf, root), " for ", leaf);
  //   for (const account of accountsTotal) {
  //     const proof = tree.getProof(keccak256(account.address));
  //     const leaf = keccak256(account.address);
  //     console.log(tree.verify(proof, leaf, root), " for ", account.address);
  //   }
  let _ = await ethers.getSigners();
  const signersEligible = _.slice(0, -3);
  const signersNotEligible = _.slice(-3);
  const accountsEligible = signersEligible.map((x) => x.address);
  const accountsNotEligible = signersNotEligible.map((x) => x.address);
  const leaves = _.map((x) => keccak256(x.address));
  const tree = new MerkleTree(leaves, keccak256);
  const root = tree.getRoot().toString("hex");
  console.log(root);
  console.log("Ethers root is ", ethers.utils.hexZeroPad(root, 32));
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const { expect } = require("chai");
const { Signer } = require("ethers");
const { ethers, tasks } = require("hardhat");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");
console.clear();

describe("DummyToken", async function () {
  async function setup() {
    const questContract = await hre.ethers.getContractFactory("QuestRewards");
    const dummyContract = await hre.ethers.getContractFactory("DummyToken");
    const dummyToken = await dummyContract.deploy("Gnosis", "GNO");
    const quest = await questContract.deploy(dummyToken.address);
    const deployerWallet = new ethers.Wallet(
      "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    );
    const deployer = deployerWallet.connect(ethers.provider);
    const userWallet = new ethers.Wallet(
      "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    );
    const user = userWallet.connect(ethers.provider);
    return [dummyToken, quest, deployer, user];
  }
  it("Should mint 1000 tokens to user", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    await expect(() =>
      dummyToken.mint(ethers.utils.parseEther("1000"), user.address)
    ).to.changeTokenBalance(dummyToken, user, ethers.utils.parseEther("1000"));
  });
  it("Should mint 1000 tokens to quests", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    await expect(() =>
      dummyToken.mint(ethers.utils.parseEther("1000"), quest.address)
    ).to.changeTokenBalance(dummyToken, quest, ethers.utils.parseEther("1000"));
  });
});

async function setup() {
  const questContract = await hre.ethers.getContractFactory("QuestRewards");
  const dummyContract = await hre.ethers.getContractFactory("DummyToken");
  const dummyToken = await dummyContract.deploy("Gnosis", "GNO");
  const quest = await questContract.deploy(dummyToken.address);
  const deployerWallet = new ethers.Wallet(
    "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  );
  const deployer = deployerWallet.connect(ethers.provider);
  const userWallet = new ethers.Wallet(
    "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
  );
  const user = userWallet.connect(ethers.provider);
  return [dummyToken, quest, deployer, user];
}

describe("Create Task", function () {
  it("Should deploy with dummy token address", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    await expect(await quest.defaultRewardToken()).to.equal(dummyToken.address);
  });

  it("Should create a task with correct parameters", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const taskIntended = {
      merkleRoot: ethers.utils.hexZeroPad("0x", 32),
      reward: ethers.utils.parseEther("100"),
      round: ethers.BigNumber.from("1"),
      rewardToken: dummyToken.address,
    };
    const txn = await quest.createTask(ethers.utils.parseEther("100"), 1);
    await txn.wait();
    const result = await quest.tasks(1);
    const returnObject = {
      merkleRoot: result["merkleRoot"],
      reward: result["reward"],
      round: result["round"],
      rewardToken: result["rewardToken"],
    };
    expect(returnObject).to.deep.equal(taskIntended);
    expect(await quest.taskExists(1)).to.equal(true);
  });

  it("Should revert when taskId creation is same or reward is zero", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(ethers.utils.parseEther("232"), 1);
    await txn.wait();
    await expect(
      quest.createTask(ethers.utils.parseEther("12"), 1)
    ).to.be.revertedWith("Task with taskId already exists");
    await expect(
      quest.createTask(ethers.utils.parseEther("0"), 2)
    ).to.be.revertedWith("Reward can't be zero");
  });

  it("Should revert when called by a non owner", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const userContract = quest.connect(ethers.provider.getSigner(1));
    await expect(
      userContract.createTask(ethers.utils.parseEther("12"), 1)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should emit the event TaskCreated", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    await expect(quest.createTask(1000, 23))
      .to.emit(quest, "TaskCreated")
      .withArgs(23, 1000);
  });
});

describe("Change Reward", async function () {
  it("Reverts when taskId does not exist", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    await expect(quest.changeReward(1, 1000)).to.be.revertedWith(
      "Task does not exist"
    );
  });

  it("Should revert when called by a non owner", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const userContract = quest.connect(ethers.provider.getSigner(1));
    const txn = await quest.createTask(1000, 1);
    await expect(userContract.changeReward(1, 1000)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("Should emit the RewardAmountChanged event", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();
    await expect(quest.changeReward(2, 200))
      .to.emit(quest, "RewardAmountChanged")
      .withArgs(2, 200);
  });
  it("Should change the reward", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();
    const txn1 = await quest.changeReward(2, 300);
    await txn1;
    const result = await quest.tasks(2);
    const taskIntended = {
      merkleRoot: ethers.utils.hexZeroPad("0x", 32),
      reward: ethers.BigNumber.from("300"),
      round: ethers.BigNumber.from("1"),
      rewardToken: dummyToken.address,
    };
    const taskReturned = {
      merkleRoot: result["merkleRoot"],
      reward: result["reward"],
      round: result["round"],
      rewardToken: result["rewardToken"],
    };
    expect(taskReturned).to.deep.equal(taskIntended);
  });
});

describe("Change Merkle Root", async function () {
  it("Reverts when taskId does not exist", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    await expect(
      quest.changeMerkleRoot(1, ethers.utils.hexZeroPad("0x", 32))
    ).to.be.revertedWith("Task does not exist");
  });

  it("Should revert when called by a non owner", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(ethers.utils.parseEther("100"), 1);
    await txn.wait();
    const userContract = quest.connect(ethers.provider.getSigner(1));
    await expect(
      userContract.changeMerkleRoot(1, ethers.utils.hexZeroPad("0x", 32))
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should emit MerkleRootChanged event", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(ethers.utils.parseEther("100"), 1);
    await txn.wait();
    await expect(quest.changeMerkleRoot(1, ethers.utils.hexZeroPad("0x", 32)))
      .to.emit(quest, "MerkleRootChanged")
      .withArgs(1, ethers.utils.hexZeroPad("0x", 32));
  });

  it("Should change the Merkle Root", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();
    const txn1 = await quest.changeMerkleRoot(
      2,
      ethers.utils.hexZeroPad("0x1234", 32)
    );
    await txn1.wait();
    const result = await quest.tasks(2);
    const taskIntended = {
      merkleRoot: ethers.utils.hexZeroPad("0x1234", 32),
      reward: ethers.BigNumber.from("200"),
      round: ethers.BigNumber.from("1"),
      rewardToken: dummyToken.address,
    };
    const taskReceived = {
      merkleRoot: result["merkleRoot"],
      reward: result["reward"],
      round: result["round"],
      rewardToken: result["rewardToken"],
    };
    expect(taskReceived).to.deep.equal(taskIntended);
  });
});

describe("Change Reward Token", async function () {
  it("Reverts when taskId does not exist", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();
    const newToken = await ethers.getContractFactory("DummyToken");
    const newTokenContract = await newToken.deploy("221", "Barks");
    await expect(
      quest.changeRewardToken(1, newTokenContract.address)
    ).to.be.revertedWith("Task does not exist");
  });

  it("Should revert when null address is used", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();
    await expect(
      quest.changeRewardToken(2, ethers.utils.hexZeroPad("0x", 20))
    ).to.be.revertedWith("Null address can't be a token");
  });

  it("Should revert when called by a non owner", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(ethers.utils.parseEther("100"), 1);
    await txn.wait();
    const userContract = quest.connect(ethers.provider.getSigner(1));
    await expect(
      userContract.changeRewardToken(1, ethers.utils.hexZeroPad("0xAB", 20))
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
  it("Should emit RewardTokenChanged event", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();
    const newToken = await ethers.getContractFactory("DummyToken");
    const newTokenContract = await newToken.deploy("Eastside", "Joe");
    await expect(quest.changeRewardToken(2, newTokenContract.address))
      .to.emit(quest, "RewardTokenChanged")
      .withArgs(2, newTokenContract.address);
  });

  it("Should change the reward value", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();

    const txn1 = await quest.changeReward(2, 300);
    await txn1.wait();
    const result = await quest.tasks(2);
    const taskIntended = {
      merkleRoot: ethers.utils.hexZeroPad("0x", 32),
      reward: ethers.BigNumber.from("300"),
      round: ethers.BigNumber.from("1"),
      rewardToken: dummyToken.address,
    };
    const taskReceived = {
      merkleRoot: result["merkleRoot"],
      reward: result["reward"],
      round: result["round"],
      rewardToken: result["rewardToken"],
    };
    expect(taskIntended).to.deep.equal(taskReceived);
  });
});

describe("Update Merkle Root", async function () {
  it("Reverts when task does not exist", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    await expect(
      quest.updateMerkleRoot(1, ethers.utils.hexZeroPad("0x123A", 32))
    ).to.be.revertedWith("Task does not exist");
  });
  it("Reverts when caller is not an owner", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();

    const userContract = quest.connect(ethers.provider.getSigner(1));
    await expect(
      userContract.updateMerkleRoot(1, ethers.utils.hexZeroPad("0x123A", 32))
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
  it("Should revert if merkle root is null", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();

    await expect(
      quest.updateMerkleRoot(2, ethers.utils.hexZeroPad("0x", 32))
    ).to.be.revertedWith("Merkle root can't be null");
  });
  it("Should change the merkle root value", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();
    const txn1 = await quest.updateMerkleRoot(
      2,
      ethers.utils.hexZeroPad("0xacff", 32)
    );
    txn1.wait();
    const result = await quest.tasks(2);
    const taskIntended = {
      merkleRoot: ethers.utils.hexZeroPad("0xacff", 32),
      reward: ethers.BigNumber.from("200"),
      round: ethers.BigNumber.from("2"),
      rewardToken: dummyToken.address,
    };
    const taskReceived = {
      merkleRoot: result["merkleRoot"],
      reward: result["reward"],
      round: result["round"],
      rewardToken: result["rewardToken"],
    };
    expect(taskReceived).to.deep.equal(taskIntended);
  });
  it("Should emit the MerkleRootChanged event", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();
    await expect(
      await quest.updateMerkleRoot(2, ethers.utils.hexZeroPad("0xacff", 32))
    )
      .to.emit(quest, "MerkleRootChanged")
      .withArgs(2, ethers.utils.hexZeroPad("0xacff", 32));
  });
});

describe("Claim Reward", async function () {});

describe("Destroy Task", async function () {
  it("Should revert when task does not exist", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    await expect(quest.destroyTask(1)).to.be.revertedWith(
      "Task does not exist"
    );
  });
  it("Should revert when called by non owner", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();
    const userContract = quest.connect(ethers.provider.getSigner(1));
    await expect(userContract.destroyTask(2)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
  it("Should emit the TaskDeleted event", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();
    await expect(quest.destroyTask(2))
      .to.emit(quest, "TaskDeleted")
      .withArgs(2);
  });
  it("Should delete the task", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn = await quest.createTask(200, 2);
    await txn.wait();
    const txn1 = await quest.destroyTask(2);
    await txn1.wait();
    const taskIntended = {
      merkleRoot: ethers.utils.hexZeroPad("0x", 32),
      reward: ethers.BigNumber.from("0"),
      round: ethers.BigNumber.from("0"),
      rewardToken: ethers.utils.hexZeroPad("0x", 20),
    };
    const result = await quest.tasks(2);
    const taskReceived = {
      merkleRoot: result["merkleRoot"],
      reward: result["reward"],
      round: result["round"],
      rewardToken: result["rewardToken"],
    };
    expect(taskReceived).to.deep.equal(taskIntended);
    expect(await quest.taskExists(2)).to.equal(false);
  });
});

describe("Sweep Tokens", async function () {
  it("Should revert when caller is not owner", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const userQuest = quest.connect(ethers.provider.getSigner(1));
    const txn1 = await dummyToken.mint(
      ethers.utils.parseEther("1000"),
      userQuest.address
    );
    await txn1.wait();
    await expect(userQuest.sweepTokens(dummyToken.address)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
  it("Should transfer tokens to owner", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const txn1 = await dummyToken.mint(1000, quest.address);
    await txn1.wait();
    await expect(() =>
      quest.sweepTokens(dummyToken.address)
    ).to.changeTokenBalances(dummyToken, [quest, deployer], [-1000, 1000]);
  });
});

describe("Sweep Ether", async function () {
  it("Should revert when called by non owner", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const userQuest = quest.connect(user);
    await expect(userQuest.sweepEther()).to.be.revertedWith(
      "'Ownable: caller is not the owner"
    );
  });
  it("Should accept Ether", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    await expect(
      async () =>
        await user.sendTransaction({
          to: quest.address,
          value: ethers.utils.parseEther("200"),
        })
    ).to.changeEtherBalances(
      [user, quest],
      [ethers.utils.parseEther("-200"), ethers.utils.parseEther("200")]
    );
  });
  it("Should send ether to the owner", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const sendTxn = await user.sendTransaction({
      to: quest.address,
      value: ethers.utils.parseEther("200"),
    });
    await sendTxn.wait();
    await expect(() => quest.sweepEther()).to.changeEtherBalances(
      [deployer, quest],
      [ethers.utils.parseEther("200"), ethers.utils.parseEther("-200")]
    );
  });
});

async function createRoot() {
  let _ = await ethers.getSigners();
  const signersEligible = _.slice(0, -3);
  const signersNotEligible = _.slice(-3);
  const accountsEligible = signersEligible.map((x) => x.address);
  const accountsNotEligible = signersNotEligible.map((x) => x.address);
  const leaves = accountsEligible.map((x) => keccak256(x));
  const tree = new MerkleTree(leaves, keccak256, { sort: true });
  const root = tree.getHexRoot();
  return [accountsEligible, accountsNotEligible, tree, root];
}
describe("Claim Reward", async function () {
  it("Should revert when taskId does not exist", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const [accountsEligible, accountsNotEligible, tree, root] =
      await createRoot();
    const createTask = await quest.createTask(ethers.utils.parseEther("2"), 24);
    await createTask.wait();
    const changeRoot = await quest.changeMerkleRoot(24, root);
    await changeRoot.wait();
    await expect(
      quest.claim(23, tree.getHexProof(keccak256(user.address)))
    ).to.be.revertedWith("Task does not exist");
  });
  it("Should revert when ineligible user tries to claim", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const [accountsEligible, accountsNotEligible, tree, root] =
      await createRoot();
    const createTask = await quest.createTask(ethers.utils.parseEther("2"), 24);
    await createTask.wait();
    const changeRoot = await quest.changeMerkleRoot(24, root);
    await changeRoot.wait();
    const ineligibleContract = quest.connect(ethers.provider.getSigner(19));
    await expect(
      ineligibleContract.claim(
        24,
        tree.getHexProof(keccak256(accountsEligible[0]))
      )
    ).to.be.revertedWith("Valid proof required");
  });

  it("Should transfer reward tokens when eligible user tries to claim", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const [accountsEligible, accountsNotEligible, tree, root] =
      await createRoot();
    const createTask = await quest.createTask(ethers.utils.parseEther("2"), 24);
    await createTask.wait();
    const tokens = await dummyToken.mint(
      ethers.utils.parseEther("2"),
      quest.address
    );
    await tokens.wait();
    const changeRoot = await quest.changeMerkleRoot(24, root);
    await changeRoot.wait();
    const userContract = quest.connect(user);
    await expect(() =>
      userContract.claim(24, tree.getHexProof(keccak256(user.address)))
    ).to.changeTokenBalances(
      dummyToken,
      [userContract, user],
      [ethers.utils.parseEther("-2"), ethers.utils.parseEther("2")]
    );

    it("Should mark user claimed", async function () {
      const claimed = await userContract.claimed(24, user.address);
      expect(claimed).to.equal(true);
    });
  });

  it("Should succeed when all users try to claim", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const [accountsEligible, accountsNotEligible, tree, root] =
      await createRoot();
    const createTask = await quest.createTask(ethers.utils.parseEther("2"), 24);
    await createTask.wait();
    const tokens = await dummyToken.mint(
      ethers.utils.parseEther("34"),
      quest.address
    );
    await tokens.wait();
    const changeRoot = await quest.changeMerkleRoot(24, root);
    await changeRoot.wait();

    const allSigners = await ethers.getSigners();
    const signers = allSigners.slice(0, -3);
    for (const signer of signers) {
      const signerContract = quest.connect(signer);
      await expect(() =>
        signerContract.claim(24, tree.getHexProof(keccak256(signer.address)))
      ).to.changeTokenBalances(
        dummyToken,
        [signerContract, signer],
        [ethers.utils.parseEther("-2"), ethers.utils.parseEther("2")]
      );
    }
  });

  it("Should revert when reward is already claimed", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const [accountsEligible, accountsNotEligible, tree, root] =
      await createRoot();
    const createTask = await quest.createTask(ethers.utils.parseEther("2"), 24);
    await createTask.wait();
    const tokens = await dummyToken.mint(
      ethers.utils.parseEther("2"),
      quest.address
    );
    await tokens.wait();
    const changeRoot = await quest.changeMerkleRoot(24, root);
    await changeRoot.wait();
    const claimTxn = await quest.claim(
      24,
      tree.getHexProof(keccak256(deployer.address))
    );
    await claimTxn.wait();
    await expect(
      quest.claim(24, tree.getHexProof(keccak256(deployer.address)))
    ).to.be.revertedWith("Reward already claimed");
  });

  it("Should revert when transfer fails", async function () {
    const [dummyToken, quest, deployer, user] = await setup();
    const [accountsEligible, accountsNotEligible, tree, root] =
      await createRoot();
    const createTask = await quest.createTask(ethers.utils.parseEther("2"), 24);
    await createTask.wait();
    const changeRoot = await quest.changeMerkleRoot(24, root);
    await changeRoot.wait();
    const userContract = quest.connect(user);
    await expect(
      userContract.claim(24, tree.getHexProof(keccak256(user.address)))
    ).to.revertedWith("ERC20: transfer amount exceeds balance");
  });
});

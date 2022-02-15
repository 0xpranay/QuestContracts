// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract QuestRewards is Ownable {
    struct Task {
        bytes32 merkleRoot;
        uint256 reward;
        uint256 round;
        IERC20 rewardToken;
    }
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => bool) public taskExists;
    mapping(uint256 => mapping(address => bool)) public claimed;
    IERC20 public defaultRewardToken;

    constructor(IERC20 defaultRewardTokenAddress) {
        defaultRewardToken = defaultRewardTokenAddress;
    }

    event TaskCreated(uint256 taskId, uint256 reward);
    event RewardAmountChanged(uint256 taskId, uint256 newReward);
    event RewardTokenChanged(uint256 taskId, IERC20 newRewardToken);
    event MerkleRootChanged(uint256 taskId, bytes32 newMerkleRoot);
    event TaskDeleted(uint256 taskId);

    function createTask(uint256 reward, uint256 taskId) external onlyOwner {
        require(reward != 0, "Reward can't be zero");
        require(!taskExists[taskId], "Task with taskId already exists");
        tasks[taskId] = Task(bytes32(0), reward, 1, defaultRewardToken);
        taskExists[taskId] = true;
        emit TaskCreated(taskId, reward);
    }

    function changeReward(uint256 taskId, uint256 newReward)
        external
        onlyOwner
    {
        require(taskExists[taskId], "Task does not exist");
        tasks[taskId].reward = newReward;
        emit RewardAmountChanged(taskId, tasks[taskId].reward);
    }

    function changeMerkleRoot(uint256 taskId, bytes32 newMerkleRoot)
        external
        onlyOwner
    {
        require(taskExists[taskId], "Task does not exist");
        tasks[taskId].merkleRoot = newMerkleRoot;
        emit MerkleRootChanged(taskId, tasks[taskId].merkleRoot);
    }

    function changeRewardToken(uint256 taskId, address newRewardToken)
        external
        onlyOwner
    {
        require(taskExists[taskId], "Task does not exist");
        require(newRewardToken != address(0), "Null address can't be a token");
        tasks[taskId].rewardToken = IERC20(newRewardToken);
        emit RewardTokenChanged(taskId, tasks[taskId].rewardToken);
    }

    function updateMerkleRoot(uint256 taskId, bytes32 newMerkleRoot)
        external
        onlyOwner
    {
        require(taskExists[taskId], "Task does not exist");
        require(newMerkleRoot != bytes32(0), "Merkle root can't be null");
        tasks[taskId].merkleRoot = newMerkleRoot;
        tasks[taskId].round += 1;
        emit MerkleRootChanged(taskId, tasks[taskId].merkleRoot);
    }

    function claim(uint256 taskId, bytes32[] calldata merkleProof) external {
        require(taskExists[taskId], "Task does not exist");
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        bool valid = MerkleProof.verify(
            merkleProof,
            tasks[taskId].merkleRoot,
            leaf
        );
        require(valid, "Valid proof required");
        require(!claimed[taskId][msg.sender], "Reward already claimed");
        claimed[taskId][msg.sender] = true;
        bool success = tasks[taskId].rewardToken.transfer(
            msg.sender,
            tasks[taskId].reward
        );
        require(success, "Reward token transfer failed");
    }

    function destroyTask(uint256 taskId) external onlyOwner {
        require(taskExists[taskId], "Task does not exist");
        taskExists[taskId] = false;
        delete tasks[taskId];
        emit TaskDeleted(taskId);
    }

    function sweepTokens(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        bool success = token.transfer(owner(), balance);
        require(success, "Token sweep failed");
    }

    function sweepEther() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Ether sweep failed");
    }

    receive() external payable {}
}

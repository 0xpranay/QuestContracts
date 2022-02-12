// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

contract DonutRewards is Ownable {
    struct Task {
        bytes32 merkleRoot;
        uint256 reward;
        uint256 round;
    }
    Task[] public tasks;
    mapping(uint256 => mapping(address => bool)) public claimed;

    event TaskCreated(uint256 tasksLength, uint256 reward);
    event RewardChanged(uint256 taskId, uint256 newReward);
    event MerkleRootChanged(uint256 taskId, bytes32 newMerkleRoot);

    function createTask(uint256 reward) public onlyOwner {
        require(reward != 0, "Reward can't be zero");
        tasks.push(Task(bytes32(0), reward, 1));
        emit TaskCreated(tasks.length, reward);
    }

    function changeReward(uint256 taskId, uint256 newReward) public onlyOwner {
        require(taskId < tasks.length, "Task ID out of bounds");
        tasks[taskId].reward = newReward;
        emit RewardChanged(taskId, tasks[taskId].reward);
    }

    function changeMerkleRoot(uint256 taskId, bytes32 newMerkleRoot)
        public
        onlyOwner
    {
        require(taskId < tasks.length, "Task ID out of bounds");
        tasks[taskId].merkleRoot = newMerkleRoot;
        emit MerkleRootChanged(taskId, tasks[taskId].merkleRoot);
    }

    function updateMerkleRoot(uint256 taskId, bytes32 newMerkleRoot)
        public
        onlyOwner
    {
        require(taskId < tasks.length, "Task ID out of bounds");
        tasks[taskId].merkleRoot = newMerkleRoot;
        tasks[taskId].round += 1;
        emit MerkleRootChanged(taskId, tasks[taskId].merkleRoot);
    }
}

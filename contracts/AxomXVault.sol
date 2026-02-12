// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AxomX Vault
/// @notice On-chain vault deposit and withdrawal with lock periods and yield tracking
contract AxomXVault is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;

    uint256 public constant MIN_DEPOSIT = 50 * 1e6; // 50 USDC (6 decimals)
    uint256 public earlyExitPenaltyBps = 1000; // 10% = 1000 basis points

    struct Plan {
        uint256 lockDays;
        uint256 dailyRateBps; // daily rate in basis points (e.g. 50 = 0.50%)
        bool active;
    }

    struct Position {
        address user;
        uint256 planId;
        uint256 principal;
        uint256 startTime;
        uint256 endTime;
        bool withdrawn;
    }

    mapping(uint256 => Plan) public plans;
    uint256 public planCount;

    Position[] public positions;
    mapping(address => uint256[]) public userPositions;

    event PlanCreated(uint256 indexed planId, uint256 lockDays, uint256 dailyRateBps);
    event Deposited(address indexed user, uint256 indexed positionId, uint256 planId, uint256 amount, uint256 endTime);
    event Withdrawn(address indexed user, uint256 indexed positionId, uint256 amount, uint256 yieldAmount, bool earlyExit);

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC");
        usdc = IERC20(_usdc);

        // Initialize default plans
        _createPlan(5, 50);   // 5 days, 0.50% daily
        _createPlan(15, 70);  // 15 days, 0.70% daily
        _createPlan(45, 90);  // 45 days, 0.90% daily
    }

    function _createPlan(uint256 lockDays, uint256 dailyRateBps) internal {
        plans[planCount] = Plan(lockDays, dailyRateBps, true);
        emit PlanCreated(planCount, lockDays, dailyRateBps);
        planCount++;
    }

    /// @notice Owner can add new vault plans
    function addPlan(uint256 lockDays, uint256 dailyRateBps) external onlyOwner {
        _createPlan(lockDays, dailyRateBps);
    }

    /// @notice Owner can toggle plan active status
    function setPlanActive(uint256 planId, bool active) external onlyOwner {
        require(planId < planCount, "Invalid plan");
        plans[planId].active = active;
    }

    /// @notice Owner can update early exit penalty (in basis points)
    function setEarlyExitPenalty(uint256 bps) external onlyOwner {
        require(bps <= 5000, "Max 50%");
        earlyExitPenaltyBps = bps;
    }

    /// @notice Deposit USDC into a vault plan
    function deposit(uint256 planId, uint256 amount) external nonReentrant {
        require(planId < planCount, "Invalid plan");
        Plan storage plan = plans[planId];
        require(plan.active, "Plan not active");
        require(amount >= MIN_DEPOSIT, "Below minimum deposit");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 endTime = block.timestamp + (plan.lockDays * 1 days);
        uint256 posId = positions.length;

        positions.push(Position({
            user: msg.sender,
            planId: planId,
            principal: amount,
            startTime: block.timestamp,
            endTime: endTime,
            withdrawn: false
        }));

        userPositions[msg.sender].push(posId);
        emit Deposited(msg.sender, posId, planId, amount, endTime);
    }

    /// @notice Withdraw a vault position (early or matured)
    function withdraw(uint256 positionId) external nonReentrant {
        require(positionId < positions.length, "Invalid position");
        Position storage pos = positions[positionId];
        require(pos.user == msg.sender, "Not your position");
        require(!pos.withdrawn, "Already withdrawn");

        pos.withdrawn = true;
        Plan storage plan = plans[pos.planId];

        uint256 daysElapsed = (block.timestamp - pos.startTime) / 1 days;
        uint256 yieldAmount = (pos.principal * plan.dailyRateBps * daysElapsed) / 10000;
        bool earlyExit = block.timestamp < pos.endTime;

        uint256 payout;
        if (earlyExit) {
            uint256 penalty = (pos.principal * earlyExitPenaltyBps) / 10000;
            payout = pos.principal - penalty + yieldAmount;
        } else {
            payout = pos.principal + yieldAmount;
        }

        require(usdc.transfer(msg.sender, payout), "Transfer failed");
        emit Withdrawn(msg.sender, positionId, payout, yieldAmount, earlyExit);
    }

    /// @notice Get user's position IDs
    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }

    /// @notice Get position details
    function getPosition(uint256 positionId) external view returns (
        address user, uint256 planId, uint256 principal,
        uint256 startTime, uint256 endTime, bool withdrawn
    ) {
        Position storage pos = positions[positionId];
        return (pos.user, pos.planId, pos.principal, pos.startTime, pos.endTime, pos.withdrawn);
    }

    /// @notice Calculate pending yield for a position
    function pendingYield(uint256 positionId) external view returns (uint256) {
        Position storage pos = positions[positionId];
        if (pos.withdrawn) return 0;
        Plan storage plan = plans[pos.planId];
        uint256 daysElapsed = (block.timestamp - pos.startTime) / 1 days;
        return (pos.principal * plan.dailyRateBps * daysElapsed) / 10000;
    }

    /// @notice Owner can withdraw excess funds (protocol fees)
    function ownerWithdraw(address to, uint256 amount) external onlyOwner {
        require(usdc.transfer(to, amount), "Transfer failed");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AxomX VIP Subscription
/// @notice On-chain VIP subscription with monthly and yearly plans
contract AxomXVIP is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;

    struct VIPPlan {
        uint256 price;       // USDC price (6 decimals)
        uint256 durationSec; // Duration in seconds
        bool active;
    }

    struct Subscription {
        address user;
        uint256 planId;
        uint256 startTime;
        uint256 expiresAt;
    }

    mapping(uint256 => VIPPlan) public vipPlans;
    uint256 public planCount;

    mapping(address => Subscription) public subscriptions;

    event PlanCreated(uint256 indexed planId, uint256 price, uint256 durationSec);
    event Subscribed(address indexed user, uint256 planId, uint256 expiresAt);
    event Renewed(address indexed user, uint256 planId, uint256 newExpiresAt);

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC");
        usdc = IERC20(_usdc);

        // Monthly: $69
        _createPlan(69 * 1e6, 30 days);
        // Yearly: $899
        _createPlan(899 * 1e6, 365 days);
    }

    function _createPlan(uint256 price, uint256 durationSec) internal {
        vipPlans[planCount] = VIPPlan(price, durationSec, true);
        emit PlanCreated(planCount, price, durationSec);
        planCount++;
    }

    /// @notice Owner adds a new VIP plan
    function addPlan(uint256 price, uint256 durationSec) external onlyOwner {
        _createPlan(price, durationSec);
    }

    /// @notice Subscribe or renew VIP
    function subscribe(uint256 planId) external nonReentrant {
        require(planId < planCount, "Invalid plan");
        VIPPlan storage plan = vipPlans[planId];
        require(plan.active, "Plan not active");
        require(usdc.transferFrom(msg.sender, address(this), plan.price), "Transfer failed");

        Subscription storage sub = subscriptions[msg.sender];
        uint256 startFrom = block.timestamp;

        // If already subscribed and not expired, extend from expiry
        if (sub.expiresAt > block.timestamp) {
            startFrom = sub.expiresAt;
            sub.planId = planId;
            sub.expiresAt = startFrom + plan.durationSec;
            emit Renewed(msg.sender, planId, sub.expiresAt);
        } else {
            sub.user = msg.sender;
            sub.planId = planId;
            sub.startTime = startFrom;
            sub.expiresAt = startFrom + plan.durationSec;
            emit Subscribed(msg.sender, planId, sub.expiresAt);
        }
    }

    /// @notice Check if user has active VIP
    function isVIP(address user) external view returns (bool) {
        return subscriptions[user].expiresAt > block.timestamp;
    }

    /// @notice Get subscription expiry timestamp
    function expiresAt(address user) external view returns (uint256) {
        return subscriptions[user].expiresAt;
    }

    /// @notice Owner can toggle plan active status
    function setPlanActive(uint256 planId, bool active) external onlyOwner {
        require(planId < planCount, "Invalid plan");
        vipPlans[planId].active = active;
    }

    /// @notice Owner can withdraw collected fees
    function ownerWithdraw(address to, uint256 amount) external onlyOwner {
        require(usdc.transfer(to, amount), "Transfer failed");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AxomX Node Membership
/// @notice On-chain node purchase with fixed yield and dividend pool distribution
contract AxomXNode is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;

    struct NodePlan {
        uint256 price;          // USDC price (6 decimals)
        uint256 durationDays;   // Lock duration
        uint256 fixedReturnBps; // Fixed return in basis points (1000 = 10%)
        uint256 weightMultiplier; // Weight multiplier (100 = 1.0x, 150 = 1.5x)
        string rankUnlock;      // Rank unlocked on purchase
        bool active;
    }

    struct Membership {
        address user;
        uint256 planId;
        uint256 price;
        uint256 startTime;
        uint256 endTime;
        uint256 claimedYield;
        bool active;
    }

    mapping(uint256 => NodePlan) public nodePlans;
    uint256 public planCount;

    Membership[] public memberships;
    mapping(address => uint256[]) public userMemberships;

    // Dividend pool funded by platform revenue
    uint256 public dividendPool;

    // Reward tracking
    uint256 public userKeepBps = 9000;  // 90% of dividends to user
    uint256 public teamPoolBps = 1000;  // 10% to team commission pool

    event PlanCreated(uint256 indexed planId, uint256 price, uint256 durationDays, uint256 fixedReturnBps);
    event NodePurchased(address indexed user, uint256 indexed membershipId, uint256 planId, uint256 price);
    event FixedYieldClaimed(address indexed user, uint256 indexed membershipId, uint256 amount);
    event DividendDistributed(uint256 totalAmount, uint256 totalWeight);
    event DividendPoolFunded(uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC");
        usdc = IERC20(_usdc);

        // MINI Node: $1,000, 90 days, 10% return, 1.0x weight, V4
        _createPlan(1000 * 1e6, 90, 1000, 100, "V4");
        // MAX Node: $6,000, 120 days, 10% return, 1.5x weight, V6
        _createPlan(6000 * 1e6, 120, 1000, 150, "V6");
    }

    function _createPlan(uint256 price, uint256 durationDays, uint256 fixedReturnBps, uint256 weightMultiplier, string memory rankUnlock) internal {
        nodePlans[planCount] = NodePlan(price, durationDays, fixedReturnBps, weightMultiplier, rankUnlock, true);
        emit PlanCreated(planCount, price, durationDays, fixedReturnBps);
        planCount++;
    }

    /// @notice Owner adds a new node plan
    function addPlan(uint256 price, uint256 durationDays, uint256 fixedReturnBps, uint256 weightMultiplier, string calldata rankUnlock) external onlyOwner {
        _createPlan(price, durationDays, fixedReturnBps, weightMultiplier, rankUnlock);
    }

    /// @notice Purchase a node membership
    function purchaseNode(uint256 planId) external nonReentrant {
        require(planId < planCount, "Invalid plan");
        NodePlan storage plan = nodePlans[planId];
        require(plan.active, "Plan not active");
        require(usdc.transferFrom(msg.sender, address(this), plan.price), "Transfer failed");

        uint256 memId = memberships.length;
        memberships.push(Membership({
            user: msg.sender,
            planId: planId,
            price: plan.price,
            startTime: block.timestamp,
            endTime: block.timestamp + (plan.durationDays * 1 days),
            claimedYield: 0,
            active: true
        }));

        userMemberships[msg.sender].push(memId);
        emit NodePurchased(msg.sender, memId, planId, plan.price);
    }

    /// @notice Claim accumulated fixed yield
    function claimFixedYield(uint256 membershipId) external nonReentrant {
        require(membershipId < memberships.length, "Invalid membership");
        Membership storage mem = memberships[membershipId];
        require(mem.user == msg.sender, "Not your membership");
        require(mem.active, "Membership not active");

        NodePlan storage plan = nodePlans[mem.planId];
        uint256 daysElapsed = (block.timestamp - mem.startTime) / 1 days;
        uint256 maxDays = plan.durationDays;
        if (daysElapsed > maxDays) daysElapsed = maxDays;

        uint256 totalYield = (mem.price * plan.fixedReturnBps * daysElapsed) / (10000 * maxDays);
        uint256 claimable = totalYield - mem.claimedYield;
        require(claimable > 0, "Nothing to claim");

        mem.claimedYield += claimable;
        require(usdc.transfer(msg.sender, claimable), "Transfer failed");
        emit FixedYieldClaimed(msg.sender, membershipId, claimable);

        // Deactivate if expired
        if (block.timestamp >= mem.endTime) {
            mem.active = false;
        }
    }

    /// @notice Fund the dividend pool (called by owner/platform)
    function fundDividendPool(uint256 amount) external onlyOwner {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        dividendPool += amount;
        emit DividendPoolFunded(amount);
    }

    /// @notice Calculate total weight of all active memberships
    function totalActiveWeight() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < memberships.length; i++) {
            Membership storage mem = memberships[i];
            if (mem.active && block.timestamp < mem.endTime) {
                NodePlan storage plan = nodePlans[mem.planId];
                total += (mem.price * plan.weightMultiplier) / 100;
            }
        }
        return total;
    }

    /// @notice Get user's membership IDs
    function getUserMemberships(address user) external view returns (uint256[] memory) {
        return userMemberships[user];
    }

    /// @notice Calculate pending fixed yield for a membership
    function pendingFixedYield(uint256 membershipId) external view returns (uint256) {
        Membership storage mem = memberships[membershipId];
        if (!mem.active) return 0;
        NodePlan storage plan = nodePlans[mem.planId];
        uint256 daysElapsed = (block.timestamp - mem.startTime) / 1 days;
        uint256 maxDays = plan.durationDays;
        if (daysElapsed > maxDays) daysElapsed = maxDays;
        uint256 totalYield = (mem.price * plan.fixedReturnBps * daysElapsed) / (10000 * maxDays);
        return totalYield - mem.claimedYield;
    }

    /// @notice Owner can update dividend split ratios
    function setDividendSplit(uint256 _userKeepBps, uint256 _teamPoolBps) external onlyOwner {
        require(_userKeepBps + _teamPoolBps == 10000, "Must total 100%");
        userKeepBps = _userKeepBps;
        teamPoolBps = _teamPoolBps;
    }

    /// @notice Owner can withdraw protocol funds
    function ownerWithdraw(address to, uint256 amount) external onlyOwner {
        require(usdc.transfer(to, amount), "Transfer failed");
    }
}

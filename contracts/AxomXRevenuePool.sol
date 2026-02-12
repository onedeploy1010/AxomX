// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AxomX Revenue Pool
/// @notice Collects platform revenue and distributes to pools (node, buyback, insurance, treasury, operations)
contract AxomXRevenuePool is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;

    // Distribution ratios in basis points (must total 10000)
    uint256 public nodePoolBps = 5000;      // 50%
    uint256 public buybackPoolBps = 2000;    // 20%
    uint256 public insurancePoolBps = 1000;  // 10%
    uint256 public treasuryPoolBps = 1000;   // 10%
    uint256 public operationsPoolBps = 1000; // 10%

    // Pool balances
    uint256 public nodePoolBalance;
    uint256 public buybackPoolBalance;
    uint256 public insurancePoolBalance;
    uint256 public treasuryPoolBalance;
    uint256 public operationsPoolBalance;

    // Pool withdrawal addresses
    address public nodePoolAddress;
    address public buybackPoolAddress;
    address public insurancePoolAddress;
    address public treasuryPoolAddress;
    address public operationsPoolAddress;

    uint256 public totalRevenue;

    event RevenueDeposited(uint256 amount, string source);
    event RevenueDistributed(uint256 nodeAmount, uint256 buybackAmount, uint256 insuranceAmount, uint256 treasuryAmount, uint256 opsAmount);
    event PoolWithdrawn(string pool, address to, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC");
        usdc = IERC20(_usdc);
    }

    /// @notice Deposit revenue into the pool for distribution
    function depositRevenue(uint256 amount, string calldata source) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Auto-distribute to pools
        uint256 nodeAmount = (amount * nodePoolBps) / 10000;
        uint256 buybackAmount = (amount * buybackPoolBps) / 10000;
        uint256 insuranceAmount = (amount * insurancePoolBps) / 10000;
        uint256 treasuryAmount = (amount * treasuryPoolBps) / 10000;
        uint256 opsAmount = amount - nodeAmount - buybackAmount - insuranceAmount - treasuryAmount;

        nodePoolBalance += nodeAmount;
        buybackPoolBalance += buybackAmount;
        insurancePoolBalance += insuranceAmount;
        treasuryPoolBalance += treasuryAmount;
        operationsPoolBalance += opsAmount;
        totalRevenue += amount;

        emit RevenueDeposited(amount, source);
        emit RevenueDistributed(nodeAmount, buybackAmount, insuranceAmount, treasuryAmount, opsAmount);
    }

    /// @notice Owner updates distribution ratios (must total 10000 bps)
    function setDistribution(
        uint256 _nodePoolBps,
        uint256 _buybackPoolBps,
        uint256 _insurancePoolBps,
        uint256 _treasuryPoolBps,
        uint256 _operationsPoolBps
    ) external onlyOwner {
        require(
            _nodePoolBps + _buybackPoolBps + _insurancePoolBps + _treasuryPoolBps + _operationsPoolBps == 10000,
            "Must total 100%"
        );
        nodePoolBps = _nodePoolBps;
        buybackPoolBps = _buybackPoolBps;
        insurancePoolBps = _insurancePoolBps;
        treasuryPoolBps = _treasuryPoolBps;
        operationsPoolBps = _operationsPoolBps;
    }

    /// @notice Set pool withdrawal addresses
    function setPoolAddresses(
        address _nodePool,
        address _buybackPool,
        address _insurancePool,
        address _treasuryPool,
        address _operationsPool
    ) external onlyOwner {
        nodePoolAddress = _nodePool;
        buybackPoolAddress = _buybackPool;
        insurancePoolAddress = _insurancePool;
        treasuryPoolAddress = _treasuryPool;
        operationsPoolAddress = _operationsPool;
    }

    /// @notice Withdraw from node pool
    function withdrawNodePool(uint256 amount) external onlyOwner {
        require(amount <= nodePoolBalance, "Exceeds balance");
        require(nodePoolAddress != address(0), "Address not set");
        nodePoolBalance -= amount;
        require(usdc.transfer(nodePoolAddress, amount), "Transfer failed");
        emit PoolWithdrawn("NODE_POOL", nodePoolAddress, amount);
    }

    /// @notice Withdraw from buyback pool
    function withdrawBuybackPool(uint256 amount) external onlyOwner {
        require(amount <= buybackPoolBalance, "Exceeds balance");
        require(buybackPoolAddress != address(0), "Address not set");
        buybackPoolBalance -= amount;
        require(usdc.transfer(buybackPoolAddress, amount), "Transfer failed");
        emit PoolWithdrawn("BUYBACK_POOL", buybackPoolAddress, amount);
    }

    /// @notice Withdraw from insurance pool
    function withdrawInsurancePool(uint256 amount) external onlyOwner {
        require(amount <= insurancePoolBalance, "Exceeds balance");
        require(insurancePoolAddress != address(0), "Address not set");
        insurancePoolBalance -= amount;
        require(usdc.transfer(insurancePoolAddress, amount), "Transfer failed");
        emit PoolWithdrawn("INSURANCE_POOL", insurancePoolAddress, amount);
    }

    /// @notice Withdraw from treasury pool
    function withdrawTreasuryPool(uint256 amount) external onlyOwner {
        require(amount <= treasuryPoolBalance, "Exceeds balance");
        require(treasuryPoolAddress != address(0), "Address not set");
        treasuryPoolBalance -= amount;
        require(usdc.transfer(treasuryPoolAddress, amount), "Transfer failed");
        emit PoolWithdrawn("TREASURY_POOL", treasuryPoolAddress, amount);
    }

    /// @notice Withdraw from operations pool
    function withdrawOperationsPool(uint256 amount) external onlyOwner {
        require(amount <= operationsPoolBalance, "Exceeds balance");
        require(operationsPoolAddress != address(0), "Address not set");
        operationsPoolBalance -= amount;
        require(usdc.transfer(operationsPoolAddress, amount), "Transfer failed");
        emit PoolWithdrawn("OPERATIONS", operationsPoolAddress, amount);
    }

    /// @notice View all pool balances
    function getPoolBalances() external view returns (
        uint256 node, uint256 buyback, uint256 insurance, uint256 treasury, uint256 operations
    ) {
        return (nodePoolBalance, buybackPoolBalance, insurancePoolBalance, treasuryPoolBalance, operationsPoolBalance);
    }
}

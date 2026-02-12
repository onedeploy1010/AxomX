// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AxomX Payment Receiver
/// @notice Accepts USDC payments tagged with a reference string (e.g. "VIP_MONTHLY", "NODE_MINI", "VAULT_5D")
contract AxomXPayment is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;

    event PaymentReceived(address indexed payer, uint256 amount, string ref, uint256 timestamp);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    /// @notice Pay USDC with a reference tag
    /// @param amount Amount in USDC (6 decimals)
    /// @param ref Reference string identifying the payment type
    function pay(uint256 amount, string calldata ref) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(bytes(ref).length > 0, "Ref cannot be empty");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit PaymentReceived(msg.sender, amount, ref, block.timestamp);
    }

    /// @notice Owner withdraws USDC to a specific address
    function withdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(usdc.transfer(to, amount), "Withdraw failed");
        emit Withdrawn(to, amount);
    }

    /// @notice Owner withdraws all USDC balance
    function withdrawAll(address to) external onlyOwner {
        require(to != address(0), "Invalid address");
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No balance");
        require(usdc.transfer(to, balance), "Withdraw failed");
        emit Withdrawn(to, balance);
    }

    /// @notice View contract USDC balance
    function getBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}

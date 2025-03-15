
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title TokenSwap
 * @dev A simple token swap contract for demonstration purposes on Sepolia testnet
 * Instructions for deployment:
 * 1. Deploy this contract on Sepolia testnet (https://sepolia.etherscan.io)
 * 2. Use Remix (https://remix.ethereum.org) or Hardhat for deployment
 * 3. Set the fee collector address in the constructor
 * 4. After deployment, copy the contract address and update it in src/config/index.ts
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSwapSepolia is Ownable {
    // Fee percentage (in basis points, e.g., 30 = 0.3%)
    uint256 public feePercent = 30;
    // Fee collector address
    address public feeCollector;
    
    event SwapCompleted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _feeCollector) {
        feeCollector = _feeCollector;
    }
    
    // Owner can update fee percentage
    function setFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 100, "Fee too high"); // Max 1%
        feePercent = _feePercent;
    }
    
    // Owner can update fee collector address
    function setFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
    }
    
    // Perform a swap between two tokens
    function swap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut,
        uint256 _price
    ) external returns (uint256) {
        // Transfer tokens from user to contract
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
        
        // Calculate output amount based on price
        uint256 amountOut = (_amountIn * _price) / 1e18;
        
        // Calculate and deduct fee
        uint256 fee = (amountOut * feePercent) / 10000;
        amountOut = amountOut - fee;
        
        // Ensure minimum output amount is met
        require(amountOut >= _minAmountOut, "Insufficient output amount");
        
        // Transfer fee to collector
        if (fee > 0) {
            IERC20(_tokenOut).transfer(feeCollector, fee);
        }
        
        // Transfer remaining output tokens to user
        IERC20(_tokenOut).transfer(msg.sender, amountOut);
        
        // Emit swap event
        emit SwapCompleted(msg.sender, _tokenIn, _tokenOut, _amountIn, amountOut);
        
        return amountOut;
    }
    
    // Emergency withdrawal function for owner
    function rescueTokens(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner(), _amount);
    }
    
    // Test function to create ERC20 test tokens (only on Sepolia)
    function createTestTokens() external onlyOwner {
        // This function would be used to create test tokens
        // On a real network, you would use existing tokens
    }
}

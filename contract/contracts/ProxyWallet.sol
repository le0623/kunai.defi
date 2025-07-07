// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ProxyWallet
 * @dev A secure proxy wallet that allows users to approve limited token access
 * without sharing private keys. The contract acts as a secure intermediary
 * between the user's wallet and trading operations.
 */
contract ProxyWallet is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Events
    event TradeExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        bytes32 tradeId
    );

    event ApprovalUpdated(
        address indexed user,
        address indexed token,
        uint256 oldAmount,
        uint256 newAmount
    );

    event EmergencyWithdraw(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    // Structs
    struct TradeRequest {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 deadline;
        bytes32 tradeId;
        bool executed;
    }

    struct UserConfig {
        uint256 maxTradeAmount;
        uint256 maxSlippage;
        bool isActive;
        uint256 dailyTradeLimit;
        uint256 dailyTradesUsed;
        uint256 lastTradeReset;
    }

    // State variables
    mapping(address => mapping(address => uint256)) public userApprovals; // user => token => amount
    mapping(address => UserConfig) public userConfigs;
    mapping(bytes32 => TradeRequest) public tradeRequests;
    mapping(address => uint256) public userBalances; // ETH balances

    address public immutable operator; // Backend operator address
    uint256 public constant MIN_APPROVAL = 0.001 ether;
    uint256 public constant MAX_APPROVAL = 100 ether;

    // Modifiers
    modifier onlyOperator() {
        require(msg.sender == operator, "ProxyWallet: Only operator");
        _;
    }

    modifier onlyApprovedUser(address user) {
        require(userConfigs[user].isActive, "ProxyWallet: User not active");
        _;
    }

    constructor(address _operator) Ownable(msg.sender) {
        require(_operator != address(0), "ProxyWallet: Invalid operator");
        operator = _operator;
    }

    /**
     * @dev Initialize user configuration
     * @param user User address
     * @param maxTradeAmount Maximum trade amount in ETH
     * @param maxSlippage Maximum slippage percentage (basis points)
     * @param dailyTradeLimit Daily trade limit in ETH
     */
    function initializeUser(
        address user,
        uint256 maxTradeAmount,
        uint256 maxSlippage,
        uint256 dailyTradeLimit
    ) external onlyOwner {
        require(user != address(0), "ProxyWallet: Invalid user");
        require(maxTradeAmount <= MAX_APPROVAL, "ProxyWallet: Amount too high");
        require(maxSlippage <= 1000, "ProxyWallet: Slippage too high"); // Max 10%

        userConfigs[user] = UserConfig({
            maxTradeAmount: maxTradeAmount,
            maxSlippage: maxSlippage,
            isActive: true,
            dailyTradeLimit: dailyTradeLimit,
            dailyTradesUsed: 0,
            lastTradeReset: block.timestamp
        });
    }

    /**
     * @dev Update user approval for a specific token
     * @param token Token address (address(0) for ETH)
     * @param amount Approval amount
     */
    function updateApproval(address token, uint256 amount) external {
        require(amount <= MAX_APPROVAL, "ProxyWallet: Amount too high");
        require(userConfigs[msg.sender].isActive, "ProxyWallet: User not active");

        uint256 oldAmount = userApprovals[msg.sender][token];
        userApprovals[msg.sender][token] = amount;

        emit ApprovalUpdated(msg.sender, token, oldAmount, amount);
    }

    /**
     * @dev Execute a trade through the proxy
     * @param user User address
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @param minAmountOut Minimum output amount
     * @param deadline Trade deadline
     * @param tradeId Unique trade identifier
     * @param dexData DEX interaction data
     */
    function executeTrade(
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline,
        bytes32 tradeId,
        bytes calldata dexData
    ) external onlyOperator onlyApprovedUser(user) nonReentrant whenNotPaused {
        require(block.timestamp <= deadline, "ProxyWallet: Trade expired");
        require(!tradeRequests[tradeId].executed, "ProxyWallet: Trade already executed");
        require(amountIn <= userApprovals[user][tokenIn], "ProxyWallet: Insufficient approval");
        require(amountIn <= userConfigs[user].maxTradeAmount, "ProxyWallet: Amount exceeds limit");

        // Check daily limits
        _resetDailyLimitsIfNeeded(user);
        require(
            userConfigs[user].dailyTradesUsed + amountIn <= userConfigs[user].dailyTradeLimit,
            "ProxyWallet: Daily limit exceeded"
        );

        // Create trade request
        tradeRequests[tradeId] = TradeRequest({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            minAmountOut: minAmountOut,
            deadline: deadline,
            tradeId: tradeId,
            executed: true
        });

        // Transfer tokens from user to contract
        if (tokenIn == address(0)) {
            // ETH trade
            require(userBalances[user] >= amountIn, "ProxyWallet: Insufficient ETH balance");
            userBalances[user] -= amountIn;
        } else {
            // ERC20 trade
            IERC20(tokenIn).safeTransferFrom(user, address(this), amountIn);
        }

        // Execute trade on DEX (this would integrate with actual DEX contracts)
        uint256 amountOut = _executeDexTrade(tokenIn, tokenOut, amountIn, minAmountOut, dexData);

        // Update daily usage
        userConfigs[user].dailyTradesUsed += amountIn;

        // Transfer output tokens to user
        if (tokenOut == address(0)) {
            // ETH output
            userBalances[user] += amountOut;
        } else {
            // ERC20 output
            IERC20(tokenOut).safeTransfer(user, amountOut);
        }

        emit TradeExecuted(user, tokenIn, tokenOut, amountIn, amountOut, tradeId);
    }

    /**
     * @dev Withdraw user's ETH balance
     */
    function withdrawETH() external nonReentrant {
        uint256 balance = userBalances[msg.sender];
        require(balance > 0, "ProxyWallet: No balance to withdraw");

        userBalances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "ProxyWallet: ETH transfer failed");
    }

    /**
     * @dev Emergency withdraw for users
     * @param token Token address to withdraw
     */
    function emergencyWithdraw(address token) external nonReentrant {
        if (token == address(0)) {
            // ETH
            uint256 balance = userBalances[msg.sender];
            if (balance > 0) {
                userBalances[msg.sender] = 0;
                (bool success, ) = msg.sender.call{value: balance}("");
                require(success, "ProxyWallet: ETH transfer failed");
                emit EmergencyWithdraw(msg.sender, token, balance);
            }
        } else {
            // ERC20
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > 0) {
                IERC20(token).safeTransfer(msg.sender, balance);
                emit EmergencyWithdraw(msg.sender, token, balance);
            }
        }
    }

    /**
     * @dev Pause contract (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get user's current approval for a token
     */
    function getApproval(address user, address token) external view returns (uint256) {
        return userApprovals[user][token];
    }

    /**
     * @dev Get user configuration
     */
    function getUserConfig(address user) external view returns (UserConfig memory) {
        return userConfigs[user];
    }

    /**
     * @dev Get trade request details
     */
    function getTradeRequest(bytes32 tradeId) external view returns (TradeRequest memory) {
        return tradeRequests[tradeId];
    }

    /**
     * @dev Reset daily limits if needed
     */
    function _resetDailyLimitsIfNeeded(address user) internal {
        UserConfig storage config = userConfigs[user];
        if (block.timestamp >= config.lastTradeReset + 1 days) {
            config.dailyTradesUsed = 0;
            config.lastTradeReset = block.timestamp;
        }
    }

    /**
     * @dev Execute trade on DEX (placeholder - would integrate with actual DEX)
     */
    function _executeDexTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes calldata dexData
    ) internal returns (uint256 amountOut) {
        // This is a placeholder - in reality, this would:
        // 1. Decode the DEX data
        // 2. Call the appropriate DEX contract (Uniswap, etc.)
        // 3. Handle slippage protection
        // 4. Return the actual amount received

        // For now, return a simulated amount
        amountOut = minAmountOut;
        
        // TODO: Implement actual DEX integration
        // Example for Uniswap V2:
        // IUniswapV2Router02 router = IUniswapV2Router02(dexData.router);
        // address[] memory path = dexData.path;
        // uint256[] memory amounts = router.swapExactTokensForTokens(
        //     amountIn,
        //     minAmountOut,
        //     path,
        //     address(this),
        //     block.timestamp
        // );
        // return amounts[amounts.length - 1];
        return 0;
    }

    // Receive ETH
    receive() external payable {
        // Allow receiving ETH for trades
    }
} 
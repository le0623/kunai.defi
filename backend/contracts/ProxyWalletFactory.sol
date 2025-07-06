// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ProxyWallet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProxyWalletFactory
 * @dev Factory contract to deploy proxy wallets for users
 */
contract ProxyWalletFactory is Ownable {
    // Events
    event ProxyWalletDeployed(
        address indexed user,
        address indexed proxyWallet,
        uint256 maxTradeAmount,
        uint256 maxSlippage
    );

    // State variables
    mapping(address => address) public userProxyWallets;
    address[] public deployedProxies;
    address public immutable operator;

    constructor(address _operator) Ownable(msg.sender) {
        require(_operator != address(0), "Factory: Invalid operator");
        operator = _operator;
    }

    /**
     * @dev Deploy a new proxy wallet for a user
     * @param user User address
     * @param maxTradeAmount Maximum trade amount in ETH
     * @param maxSlippage Maximum slippage percentage (basis points)
     * @param dailyTradeLimit Daily trade limit in ETH
     */
    function deployProxyWallet(
        address user,
        uint256 maxTradeAmount,
        uint256 maxSlippage,
        uint256 dailyTradeLimit
    ) external onlyOwner returns (address proxyWallet) {
        require(user != address(0), "Factory: Invalid user");
        require(userProxyWallets[user] == address(0), "Factory: Proxy already exists");

        // Deploy new proxy wallet
        proxyWallet = address(new ProxyWallet(operator));
        
        // Initialize the proxy wallet
        ProxyWallet(payable(proxyWallet)).initializeUser(
            user,
            maxTradeAmount,
            maxSlippage,
            dailyTradeLimit
        );

        // Store mapping
        userProxyWallets[user] = proxyWallet;
        deployedProxies.push(proxyWallet);

        emit ProxyWalletDeployed(user, proxyWallet, maxTradeAmount, maxSlippage);
    }

    /**
     * @dev Get proxy wallet address for a user
     */
    function getProxyWallet(address user) external view returns (address) {
        return userProxyWallets[user];
    }

    /**
     * @dev Get all deployed proxy wallets
     */
    function getAllDeployedProxies() external view returns (address[] memory) {
        return deployedProxies;
    }

    /**
     * @dev Get total number of deployed proxies
     */
    function getDeployedCount() external view returns (uint256) {
        return deployedProxies.length;
    }
} 
// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const ProxyWalletModule = buildModule('ProxyWalletModule', (m) => {
  // Deploy the proxy wallet factory contract
  const proxyWalletFactory = m.contract('ProxyWalletFactory', [m.getAccount(0)]);

  return { proxyWalletFactory };
});

export default ProxyWalletModule;
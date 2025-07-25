// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import "hardhat/types/artifacts";
import type { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";

import { ProxyWalletFactory$Type } from "./ProxyWalletFactory";

declare module "hardhat/types/artifacts" {
  interface ArtifactsMap {
    ["ProxyWalletFactory"]: ProxyWalletFactory$Type;
    ["contracts/ProxyWalletFactory.sol:ProxyWalletFactory"]: ProxyWalletFactory$Type;
  }

  interface ContractTypesMap {
    ["ProxyWalletFactory"]: GetContractReturnType<ProxyWalletFactory$Type["abi"]>;
    ["contracts/ProxyWalletFactory.sol:ProxyWalletFactory"]: GetContractReturnType<ProxyWalletFactory$Type["abi"]>;
  }
}

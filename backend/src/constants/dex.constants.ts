export const UNISWAP_V3 = {
  SWAP_ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  QUOTER_V2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  ERC20_ABI: [
    'function approve(address spender, uint256 value) external returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address) view returns (uint256)'
  ],
  QUOTER_ABI: [
    'function quoteExactInputSingle((address,address,uint24,uint256,uint160)) external returns (uint256 amountOut, uint160, uint32, uint256)'
  ],
  SWAP_ROUTER_ABI: [
    'function exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160)) payable returns (uint256 amountOut)'
  ]
};

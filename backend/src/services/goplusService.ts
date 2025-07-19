import axios from 'axios';
import { logger } from '../utils/logger';

interface GoPlusTokenSecurityResponse {
  code: number;
  message: string;
  result: GoPlusTokenSecurityResult[];
}

interface GoPlusTokenSecurityResult {
  approved_list: ApprovedAddressInfo[];
  address_info: {
    approved_amount: string;
    approved_contract: string;
    approved_time: number;
    hash: string;
    initial_approval_hash: string;
    initial_approval_time: number;
    balance: string;
    chain_id: string;
    decimals: number;
    is_open_source: number;
    malicious_address: number;
    malicious_behavior: string[];
    token_address: string;
    token_name: string;
    token_symbol: string;
  };
}

interface ApprovedAddressInfo {
  approved_amount: string;
  approved_contract: string;
  approved_time: number;
  hash: string;
  initial_approval_hash: string;
  initial_approval_time: number;
}

interface TokenSecurityInfo {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  chainId: string;
  decimals: number;
  isOpenSource: boolean;
  isMalicious: boolean;
  maliciousBehaviors: string[];
  approvedContracts: ApprovedAddressInfo[];
  balance: string;
}

class GoPlusService {
  private baseUrl = 'https://api.gopluslabs.io/api/v1';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env['GOPLUS_API_KEY'] || '';
    if (!this.apiKey) {
      logger.warn(
        'GoPlus API key not found. Token security features will be limited.'
      );
    }
  }

  /**
   * Get token security information from GoPlus Labs
   */
  async getTokenSecurity(
    chainId: string,
    tokenAddress: string
  ): Promise<TokenSecurityInfo | null> {
    try {
      if (!this.apiKey) {
        logger.warn('GoPlus API key not configured');
        return null;
      }

      const response = await axios.get<GoPlusTokenSecurityResponse>(
        `${this.baseUrl}/token_security/${chainId}`,
        {
          params: {
            contract_addresses: tokenAddress,
          },
          headers: {
            // 'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (response.data.code !== 1) {
        logger.error(`GoPlus API error: ${response.data.message}`);
        return null;
      }

      if (!response.data.result || response.data.result.length === 0) {
        logger.warn(
          `No security data found for token ${tokenAddress} on chain ${chainId}`
        );
        return null;
      }

      const result = response.data.result[0];
      if (!result) {
        logger.warn(
          `No result data for token ${tokenAddress} on chain ${chainId}`
        );
        return null;
      }

      const addressInfo = result.address_info;

      return {
        tokenAddress: addressInfo.token_address,
        tokenName: addressInfo.token_name,
        tokenSymbol: addressInfo.token_symbol,
        chainId: addressInfo.chain_id,
        decimals: addressInfo.decimals,
        isOpenSource: addressInfo.is_open_source === 1,
        isMalicious: addressInfo.malicious_address === 1,
        maliciousBehaviors: addressInfo.malicious_behavior || [],
        approvedContracts: result.approved_list || [],
        balance: addressInfo.balance,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          logger.error('GoPlus API: Unauthorized - Check API key');
        } else if (error.response?.status === 403) {
          logger.error('GoPlus API: Forbidden - Check API permissions');
        } else if (error.response?.status === 404) {
          logger.warn(
            `GoPlus API: Token not found - ${tokenAddress} on chain ${chainId}`
          );
        } else {
          logger.error(`GoPlus API error: ${error.message}`, {
            status: error.response?.status,
            data: error.response?.data,
          });
        }
      } else {
        logger.error('GoPlus API: Unexpected error', error);
      }
      return null;
    }
  }

  /**
   * Get multiple tokens security information
   */
  async getMultipleTokensSecurity(
    chainId: string,
    tokenAddresses: string[]
  ): Promise<TokenSecurityInfo[]> {
    try {
      if (!this.apiKey) {
        logger.warn('GoPlus API key not configured');
        return [];
      }

      if (tokenAddresses.length === 0) {
        return [];
      }

      // GoPlus API accepts comma-separated addresses
      const addressesParam = tokenAddresses.join(',');

      const response = await axios.get<GoPlusTokenSecurityResponse>(
        `${this.baseUrl}/token_security/${chainId}`,
        {
          params: {
            addresses: addressesParam,
          },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 second timeout for multiple tokens
        }
      );

      if (response.data.code !== 1) {
        logger.error(`GoPlus API error: ${response.data.message}`);
        return [];
      }

      if (!response.data.result || response.data.result.length === 0) {
        return [];
      }

      return response.data.result.map(result => {
        const addressInfo = result.address_info;
        return {
          tokenAddress: addressInfo.token_address,
          tokenName: addressInfo.token_name,
          tokenSymbol: addressInfo.token_symbol,
          chainId: addressInfo.chain_id,
          decimals: addressInfo.decimals,
          isOpenSource: addressInfo.is_open_source === 1,
          isMalicious: addressInfo.malicious_address === 1,
          maliciousBehaviors: addressInfo.malicious_behavior || [],
          approvedContracts: result.approved_list || [],
          balance: addressInfo.balance,
        };
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`GoPlus API error for multiple tokens: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        logger.error('GoPlus API: Unexpected error for multiple tokens', error);
      }
      return [];
    }
  }

  /**
   * Check if a token is safe (not malicious and open source)
   */
  async isTokenSafe(chainId: string, tokenAddress: string): Promise<boolean> {
    const securityInfo = await this.getTokenSecurity(chainId, tokenAddress);
    return securityInfo
      ? !securityInfo.isMalicious && securityInfo.isOpenSource
      : false;
  }

  /**
   * Get malicious behaviors for a token
   */
  async getMaliciousBehaviors(
    chainId: string,
    tokenAddress: string
  ): Promise<string[]> {
    const securityInfo = await this.getTokenSecurity(chainId, tokenAddress);
    return securityInfo?.maliciousBehaviors || [];
  }

  /**
   * Get approved contracts for a token
   */
  async getApprovedContracts(
    chainId: string,
    tokenAddress: string
  ): Promise<ApprovedAddressInfo[]> {
    const securityInfo = await this.getTokenSecurity(chainId, tokenAddress);
    return securityInfo?.approvedContracts || [];
  }
}

export const goplusService = new GoPlusService();
export type { TokenSecurityInfo, ApprovedAddressInfo };

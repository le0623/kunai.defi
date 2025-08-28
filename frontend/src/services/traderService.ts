import api from '@/lib/axios';
import type { Trader } from '@/components/table/trader-columns';

export interface TraderFilters {
  category?: 'all' | 'smart-money' | 'kol-vc' | 'fresh-wallet' | 'sniper';
  minBalance?: string;
  maxBalance?: string;
  minWinRate?: number;
  maxWinRate?: number;
  minTransactions?: number;
  maxTransactions?: number;
  sortBy?: 'ethBalance' | 'oneDayPnl' | 'sevenDayPnl' | 'thirtyDayPnl' | 'sevenDayWinRate' | 'sevenDayTransactions' | 'trackedBy' | 'lastTime';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface TraderStats {
  totalTraders: number;
  averageWinRate: number;
  averagePnl: string;
  topPerformers: Trader[];
}

export interface CopyTradeSettings {
  name?: string;
  allocation?: number;
  maxSlippage?: number;
  gasLimit?: number;
  gasPrice?: number;
  minTradeAmount?: string;
  maxTradeAmount?: string;
  tokenWhitelist?: string[];
  tokenBlacklist?: string[];
  maxDailyLoss?: string;
  stopLoss?: number;
  takeProfit?: number;
}

export class TraderService {
  /**
   * Get traders ranked by various metrics
   */
  static async getTradersByRank(filters: TraderFilters = {}): Promise<Trader[]> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/api/traders/rank?${params.toString()}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching traders by rank:', error);
      throw error;
    }
  }

  /**
   * Get trader statistics
   */
  static async getTraderStats(): Promise<TraderStats> {
    try {
      const response = await api.get('/api/traders/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching trader stats:', error);
      throw error;
    }
  }

  /**
   * Track a trader (create copy trade setting)
   */
  static async trackTrader(targetAddress: string, settings: CopyTradeSettings = {}): Promise<void> {
    try {
      await api.post('/api/traders/track', { targetAddress, settings });
    } catch (error) {
      console.error('Error tracking trader:', error);
      throw error;
    }
  }

  /**
   * Untrack a trader (delete copy trade setting)
   */
  static async untrackTrader(copyTradeId: string): Promise<void> {
    try {
      await api.post('/api/traders/untrack', { copyTradeId });
    } catch (error) {
      console.error('Error untracking trader:', error);
      throw error;
    }
  }

  /**
   * Get user's copy trade settings
   */
  static async getUserCopyTrades(): Promise<any[]> {
    try {
      const response = await api.get('/api/traders/user/copy-trades');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching user copy trades:', error);
      throw error;
    }
  }

  /**
   * Get trader details by address
   */
  static async getTraderDetails(address: string): Promise<any> {
    try {
      const response = await api.get(`/api/traders/${address}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching trader details:', error);
      throw error;
    }
  }

  /**
   * Add a trade record
   */
  static async addTrade(tradeData: any): Promise<void> {
    try {
      await api.post('/api/traders/trades', tradeData);
    } catch (error) {
      console.error('Error adding trade:', error);
      throw error;
    }
  }

  /**
   * Update trade profit
   */
  static async updateTradeProfit(tradeId: string, profit: string, duration?: number): Promise<void> {
    try {
      await api.put(`/api/traders/trades/${tradeId}/profit`, { profit, duration });
    } catch (error) {
      console.error('Error updating trade profit:', error);
      throw error;
    }
  }

  /**
   * Create a new copy trade
   */
  static async createCopyTrade(settings: any): Promise<any> {
    try {
      const response = await api.post('/api/traders/copy-trades', settings);
      return response.data.data;
    } catch (error) {
      console.error('Error creating copy trade:', error);
      throw error;
    }
  }

  /**
   * Update a copy trade
   */
  static async updateCopyTrade(id: string, settings: any): Promise<any> {
    try {
      const response = await api.put(`/api/traders/copy-trades/${id}`, settings);
      return response.data.data;
    } catch (error) {
      console.error('Error updating copy trade:', error);
      throw error;
    }
  }

  /**
   * Delete a copy trade
   */
  static async deleteCopyTrade(id: string): Promise<any> {
    try {
      const response = await api.delete(`/api/traders/copy-trades/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error deleting copy trade:', error);
      throw error;
    }
  }
} 
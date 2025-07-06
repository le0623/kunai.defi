import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function AlertsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Price Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <div className="font-semibold">BTC &gt; $50,000</div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
            <button className="text-red-500 hover:text-red-400">
              <XCircle size={20} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <div className="font-semibold">ETH &gt; $3,000</div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
            <button className="text-red-500 hover:text-red-400">
              <XCircle size={20} />
            </button>
          </div>
        </div>

        <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold transition-colors">
          Add New Alert
        </button>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Recent Notifications</h3>
        <div className="space-y-3">
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-yellow-500 mt-1" />
              <div>
                <div className="font-semibold">New Pool Alert</div>
                <div className="text-sm text-gray-400">TOKEN1 listed on Uniswap V2</div>
                <div className="text-xs text-gray-500 mt-1">2 minutes ago</div>
              </div>
            </div>
          </div>
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-1" />
              <div>
                <div className="font-semibold">Trade Executed</div>
                <div className="text-sm text-gray-400">Successfully bought TOKEN2</div>
                <div className="text-xs text-gray-500 mt-1">5 minutes ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
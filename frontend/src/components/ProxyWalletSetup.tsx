import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { ethers } from 'ethers';

interface ProxyWalletConfig {
  maxTradeAmount: string;
  maxSlippage: number;
  dailyTradeLimit: string;
  gasLimit: number;
  gasPrice: string;
}

export function ProxyWalletSetup() {
  const { address, isConnected } = useAccount();
  const [config, setConfig] = useState<ProxyWalletConfig>({
    maxTradeAmount: '0.1',
    maxSlippage: 5,
    dailyTradeLimit: '1.0',
    gasLimit: 500000,
    gasPrice: '20'
  });
  const [step, setStep] = useState<'setup' | 'deploying' | 'approving' | 'complete'>('setup');
  const [proxyAddress, setProxyAddress] = useState<string>('');

  const handleDeployProxy = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setStep('deploying');
    
    try {
      // This would call the backend API to deploy the proxy wallet
      const response = await fetch('/api/proxy/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          config
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setProxyAddress(result.proxyAddress);
        setStep('approving');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error deploying proxy wallet:', error);
      alert('Failed to deploy proxy wallet');
      setStep('setup');
    }
  };

  const handleApproveTokens = async (token: string, amount: string) => {
    try {
      // This would call the backend API to approve tokens
      const response = await fetch('/api/proxy/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          tokenAddress: token,
          amount: ethers.parseEther(amount).toString()
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`${token} approval successful!`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error approving tokens:', error);
      alert(`Failed to approve ${token}`);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🔐 Proxy Wallet Setup</CardTitle>
          <CardDescription>
            Connect your wallet to set up a secure proxy for non-custodial trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please connect your wallet to continue with the proxy wallet setup.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔐 Proxy Wallet Setup
            <Badge variant="secondary">Non-Custodial</Badge>
          </CardTitle>
          <CardDescription>
            Set up a secure smart contract proxy that allows automated trading without sharing your private keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step === 'setup' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'setup' ? 'border-blue-600 bg-blue-100' : 'border-gray-300'}`}>
                1
              </div>
              <span className="ml-2">Configure</span>
            </div>
            <div className={`flex items-center ${step === 'deploying' ? 'text-blue-600' : step === 'approving' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'deploying' ? 'border-blue-600 bg-blue-100' : step === 'approving' || step === 'complete' ? 'border-green-600 bg-green-100' : 'border-gray-300'}`}>
                2
              </div>
              <span className="ml-2">Deploy</span>
            </div>
            <div className={`flex items-center ${step === 'approving' ? 'text-blue-600' : step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'approving' ? 'border-blue-600 bg-blue-100' : step === 'complete' ? 'border-green-600 bg-green-100' : 'border-gray-300'}`}>
                3
              </div>
              <span className="ml-2">Approve</span>
            </div>
            <div className={`flex items-center ${step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'complete' ? 'border-green-600 bg-green-100' : 'border-gray-300'}`}>
                4
              </div>
              <span className="ml-2">Ready</span>
            </div>
          </div>

          {/* Configuration Form */}
          {step === 'setup' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="maxTradeAmount">Max Trade Amount (ETH)</Label>
                  <Input
                    id="maxTradeAmount"
                    type="number"
                    step="0.01"
                    value={config.maxTradeAmount}
                    onChange={(e) => setConfig({ ...config, maxTradeAmount: e.target.value })}
                    placeholder="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxSlippage">Max Slippage (%)</Label>
                  <Select value={config.maxSlippage.toString()} onValueChange={(value) => setConfig({ ...config, maxSlippage: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1%</SelectItem>
                      <SelectItem value="3">3%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dailyTradeLimit">Daily Trade Limit (ETH)</Label>
                  <Input
                    id="dailyTradeLimit"
                    type="number"
                    step="0.1"
                    value={config.dailyTradeLimit}
                    onChange={(e) => setConfig({ ...config, dailyTradeLimit: e.target.value })}
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <Label htmlFor="gasPrice">Gas Price (Gwei)</Label>
                  <Input
                    id="gasPrice"
                    type="number"
                    value={config.gasPrice}
                    onChange={(e) => setConfig({ ...config, gasPrice: e.target.value })}
                    placeholder="20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Deploying State */}
          {step === 'deploying' && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p>Deploying your proxy wallet...</p>
              <p className="text-sm text-gray-500">This may take a few minutes</p>
            </div>
          )}

          {/* Approval State */}
          {step === 'approving' && (
            <div className="space-y-6">
              <Alert>
                <AlertDescription>
                  ✅ Proxy wallet deployed successfully! Now approve tokens for trading.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">💰 ETH</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleApproveTokens('0x0000000000000000000000000000000000000000', config.maxTradeAmount)}
                      className="w-full"
                    >
                      Approve ETH
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">💵 USDC</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleApproveTokens('0xA0b86a33E6441b8c4c8c8c8c8c8c8c8c8c8c8c8c', '100')}
                      className="w-full"
                    >
                      Approve USDC
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button onClick={() => setStep('complete')} variant="outline">
                  Skip Approvals (Continue Later)
                </Button>
              </div>
            </div>
          )}

          {/* Complete State */}
          {step === 'complete' && (
            <div className="text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <h3 className="text-xl font-semibold">Proxy Wallet Ready!</h3>
              <p className="text-gray-600">
                Your proxy wallet is now set up and ready for non-custodial trading.
              </p>
              
              {proxyAddress && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm font-mono break-all">{proxyAddress}</p>
                  <p className="text-xs text-gray-500 mt-1">Proxy Wallet Address</p>
                </div>
              )}
              
              <div className="flex justify-center space-x-4">
                <Button onClick={() => window.location.href = '/dashboard'}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => setStep('setup')}>
                  Configure More
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {step === 'setup' && (
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setConfig({
                maxTradeAmount: '0.1',
                maxSlippage: 5,
                dailyTradeLimit: '1.0',
                gasLimit: 500000,
                gasPrice: '20'
              })}>
                Reset to Defaults
              </Button>
              <Button onClick={handleDeployProxy}>
                Deploy Proxy Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle>🔒 Security Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="text-green-600 text-xl">✓</div>
              <div>
                <h4 className="font-semibold">Non-Custodial</h4>
                <p className="text-sm text-gray-600">Your private keys stay with you</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="text-green-600 text-xl">✓</div>
              <div>
                <h4 className="font-semibold">Limited Access</h4>
                <p className="text-sm text-gray-600">Set your own spending limits</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="text-green-600 text-xl">✓</div>
              <div>
                <h4 className="font-semibold">Smart Contract Protection</h4>
                <p className="text-sm text-gray-600">All trades go through secure contracts</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="text-green-600 text-xl">✓</div>
              <div>
                <h4 className="font-semibold">Emergency Withdrawal</h4>
                <p className="text-sm text-gray-600">Withdraw funds anytime</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
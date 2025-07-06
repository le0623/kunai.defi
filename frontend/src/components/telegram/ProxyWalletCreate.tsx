import { useState, type PropsWithChildren } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import api from '@/lib/axios';
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";

interface ProxyWalletCreateProps {
  wallet?: string;
}

const ProxyWalletCreate: React.FC<PropsWithChildren<ProxyWalletCreateProps>> = ({ wallet }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>(wallet || '');
  const navigate = useNavigate();

  const deployProxyWallet = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/api/telegram-webapp/wallet/deploy', {
        walletAddress: walletAddress
      });
      if (response.data.success) {
        toast.success('Proxy wallet deployed successfully');
        navigate('/webapp');
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.error || 'Failed to deploy proxy wallet');
      } else {
        toast.error('Failed to deploy proxy wallet');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen w-screen bg-gray-900 text-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">🚀 Welcome to KunAI Sniper Bot!</h2>
        <p className="text-blue-100">
          To start trading, you need to deploy a secure proxy wallet first.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-400 mb-2">What is a Proxy Wallet?</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Secure smart contract that acts as a proxy for your trades</li>
            <li>• Protects your main wallet from potential risks</li>
            <li>• Allows for advanced trading features and automation</li>
            <li>• You maintain full control over your funds</li>
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your Main Wallet</label>
            <Input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>

          <Button
            onClick={deployProxyWallet}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 p-3 transition-colors duration-300"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deploying...
              </>
            ) : (
              '🚀 Deploy Proxy Wallet'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProxyWalletCreate;
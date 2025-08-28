import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setIsCopyTradeSheetOpen } from '@/store/slices/uiSlice'
import { TraderService } from '@/services/traderService'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccount as useWagmiAccount, useBalance } from 'wagmi'
import { useAuth } from '@/hooks'
import { authAPI, walletAPI } from '@/services/api'
import { shortenAddress } from '@/lib/utils'
import { 
  Wallet, 
  Copy, 
  Settings, 
  Info, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CopyTradeSettings {
  targetAddress: string
  copyBuy: {
    enabled: boolean
    strategy: 'max' | 'fixed' | 'ratio'
    maxAmount: string
    fixedAmount: string
    ratio: string
  }
  copySell: {
    enabled: boolean
  }
  customSettings: {
    slippage: string
    priorityFee: string
    antiMevRpc: boolean
    customRpc: string
  }
}

interface CopyTradeSheetProps {
  targetAddress?: string
  onCopyTradeCreated?: () => void
}

const CopyTradeSheet = ({ targetAddress = '', onCopyTradeCreated }: CopyTradeSheetProps) => {
  const dispatch = useAppDispatch()
  const isOpen = useAppSelector((state) => state.ui.isCopyTradeSheetOpen)
  
  // Wallet data hooks
  const { isAuthenticated } = useAuth()
  const { address: externalWalletAddress, isConnected } = useWagmiAccount()
  const { data: externalEthBalance } = useBalance({
    address: externalWalletAddress,
    chainId: 1,
  })
  
  // Wallet info state
  const [walletInfo, setWalletInfo] = useState<{
    address: string
    balance: number
  } | null>(null)
  
  const [settings, setSettings] = useState<CopyTradeSettings>({
    targetAddress: targetAddress,
    copyBuy: {
      enabled: true,
      strategy: 'max',
      maxAmount: '1.0',
      fixedAmount: '0.1',
      ratio: '100'
    },
    copySell: {
      enabled: true
    },
    customSettings: {
      slippage: '2.0',
      priorityFee: '0.001',
      antiMevRpc: false,
      customRpc: ''
    }
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    dispatch(setIsCopyTradeSheetOpen(false))
  }

  // Load wallet info
  useEffect(() => {
    const fetchWalletInfo = async () => {
      if (isAuthenticated) {
        if (isConnected && externalWalletAddress) {
          // Use external wallet balance
          setWalletInfo({
            address: externalWalletAddress,
            balance: Number(externalEthBalance?.formatted || 0),
          })
        } else {
          // Use in-app wallet balance from backend
          try {
            const balanceData = await walletAPI.getCurrentUserWalletBalance()
            if (balanceData.success) {
              setWalletInfo({
                address: balanceData.balance.address,
                balance: Number(balanceData.balance.eth || 0),
              })
            }
          } catch (error) {
            console.error('Error fetching in-app wallet balance:', error)
            // Fallback to user data if API fails
            try {
              const user = await authAPI.getCurrentUser()
              setWalletInfo({
                address: user.inAppWallet || '',
                balance: 0,
              })
            } catch (userError) {
              console.error('Error fetching user data:', userError)
            }
          }
        }
      }
    }
    fetchWalletInfo()
  }, [isAuthenticated, isConnected, externalWalletAddress, externalEthBalance?.formatted])

  // Update targetAddress when prop changes
  useEffect(() => {
    if (targetAddress) {
      updateSettings('targetAddress', targetAddress)
    }
  }, [targetAddress])

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    // Validate target address
    if (!settings.targetAddress || settings.targetAddress.trim() === '') {
      newErrors.targetAddress = 'Target address is required'
    } else {
      const addressRegex = /^0x[a-fA-F0-9]{40}$/
      if (!addressRegex.test(settings.targetAddress.trim())) {
        newErrors.targetAddress = 'Please enter a valid Ethereum address'
      }
    }

    // Validate that at least one copy option is enabled
    if (!settings.copyBuy.enabled && !settings.copySell.enabled) {
      newErrors.copyOptions = 'Please enable at least one copy option (buy or sell)'
    }

    // Validate copy buy settings if enabled
    if (settings.copyBuy.enabled) {
      if (settings.copyBuy.strategy === 'max' && (!settings.copyBuy.maxAmount || parseFloat(settings.copyBuy.maxAmount) <= 0)) {
        newErrors.maxAmount = 'Please enter a valid max buy amount'
      }
      if (settings.copyBuy.strategy === 'fixed' && (!settings.copyBuy.fixedAmount || parseFloat(settings.copyBuy.fixedAmount) <= 0)) {
        newErrors.fixedAmount = 'Please enter a valid fixed buy amount'
      }
      if (settings.copyBuy.strategy === 'ratio' && (!settings.copyBuy.ratio || parseFloat(settings.copyBuy.ratio) <= 0)) {
        newErrors.ratio = 'Please enter a valid ratio percentage'
      }
    }

    // Validate custom settings
    if (!settings.customSettings.slippage || parseFloat(settings.customSettings.slippage) <= 0) {
      newErrors.slippage = 'Please enter a valid slippage percentage'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleConfirm = async () => {
    if (isSubmitting) return

    // Validate form
    if (!validateForm()) {
      // Show first error as toast
      const firstError = Object.values(errors)[0]
      if (firstError) {
        toast.error(firstError)
      }
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare the copy trade data
      const copyTradeData = {
        name: `Copy ${settings.targetAddress.slice(0, 6)}...${settings.targetAddress.slice(-4)}`,
        targetAddress: settings.targetAddress.trim(),
        allocation: settings.copyBuy.enabled ? 100 : 0, // Default to 100% if enabled
        maxSlippage: parseFloat(settings.customSettings.slippage),
        gasLimit: 500000, // Default value
        gasPrice: 20, // Default value
        minTradeAmount: settings.copyBuy.strategy === 'max' ? settings.copyBuy.maxAmount : '0.01',
        maxTradeAmount: settings.copyBuy.strategy === 'max' ? settings.copyBuy.maxAmount : '1.0',
        tokenWhitelist: [],
        tokenBlacklist: [],
        maxDailyLoss: '0.1', // Default value
        stopLoss: 10.0, // Default value
        takeProfit: 20.0, // Default value
        isActive: settings.copyBuy.enabled || settings.copySell.enabled
      }
      
      // Show loading toast
      const loadingToast = toast.loading('Creating copy trade...')
      
      try {
        // Call the API to create copy trade
        await TraderService.createCopyTrade(copyTradeData)
        
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast)
        toast.success('Copy trade created successfully!')
        
        handleClose()
        
        // Refresh the copy trades list
        if (onCopyTradeCreated) {
          onCopyTradeCreated()
        }
      } catch (error: any) {
        // Dismiss loading toast first
        toast.dismiss(loadingToast)
        
        console.error('Error creating copy trade:', error)
        
        // Show error message
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create copy trade'
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Error in handleConfirm:', error)
      
      // Show generic error message
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      const keys = path.split('.')
      let current: any = newSettings
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Create Copy Trade
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 p-4">
          {/* My Wallet */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">My Wallet</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {walletInfo?.address ? shortenAddress(walletInfo.address) : 'Not connected'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {walletInfo?.balance ? `${walletInfo.balance.toFixed(4)} ETH` : '0 ETH'}
                  </p>
                </div>
              </div>
              <Badge variant={walletInfo?.address ? "secondary" : "destructive"}>
                {walletInfo?.address ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </div>

          {/* Target Wallet */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">Copy From Wallet</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAddress">Target Address</Label>
              <Input
                id="targetAddress"
                placeholder="Enter wallet address to copy from"
                value={settings.targetAddress}
                onChange={(e) => {
                  updateSettings('targetAddress', e.target.value)
                  // Clear error when user starts typing
                  if (errors.targetAddress) {
                    setErrors(prev => ({ ...prev, targetAddress: '' }))
                  }
                }}
                className={errors.targetAddress ? 'border-red-500' : ''}
              />
              {errors.targetAddress && (
                <p className="text-sm text-red-500">{errors.targetAddress}</p>
              )}
            </div>
          </div>

          {/* Copy Settings */}
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Copy Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Copy Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4">
              <div className="space-y-4">
                                    {/* Enable Copy Buy */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="copyBuyEnabled">Enable Copy Buy</Label>
                      <Switch
                        id="copyBuyEnabled"
                        checked={settings.copyBuy.enabled}
                        onCheckedChange={(checked) => {
                          updateSettings('copyBuy.enabled', checked)
                          // Clear error when user enables copy buy
                          if (errors.copyOptions) {
                            setErrors(prev => ({ ...prev, copyOptions: '' }))
                          }
                        }}
                      />
                    </div>
                    {errors.copyOptions && (
                      <p className="text-sm text-red-500">{errors.copyOptions}</p>
                    )}

                {settings.copyBuy.enabled && (
                  <>
                    <Separator />
                    
                    {/* Strategy Selection */}
                    <div className="space-y-2">
                      <Label>Buy Strategy</Label>
                      <Select
                        value={settings.copyBuy.strategy}
                        onValueChange={(value) => updateSettings('copyBuy.strategy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="max">Max Buy Amount</SelectItem>
                          <SelectItem value="fixed">Fixed Buy Amount</SelectItem>
                          <SelectItem value="ratio">Fixed Ratio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Strategy-specific inputs */}
                    {settings.copyBuy.strategy === 'max' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="maxAmount">Max Buy Amount (ETH)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  If the target's buy amount exceeds the max, copy buy at the max. 
                                  Otherwise, follow the target's buy amount.
                                  <br /><br />
                                  The max buy is 1 ETH. When target address buys 0.5 ETH, 
                                  the user buy 0.5 ETH. If the target address buys 2 ETH, 
                                  the user buy 1 ETH
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id="maxAmount"
                          type="number"
                          step="0.1"
                          value={settings.copyBuy.maxAmount}
                          onChange={(e) => updateSettings('copyBuy.maxAmount', e.target.value)}
                          placeholder="1.0"
                        />
                      </div>
                    )}

                    {settings.copyBuy.strategy === 'fixed' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="fixedAmount">Fixed Buy Amount (ETH)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  No matter how much the target address buys, copy buy order 
                                  will be made according to the fixed amount.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id="fixedAmount"
                          type="number"
                          step="0.1"
                          value={settings.copyBuy.fixedAmount}
                          onChange={(e) => updateSettings('copyBuy.fixedAmount', e.target.value)}
                          placeholder="0.1"
                        />
                      </div>
                    )}

                    {settings.copyBuy.strategy === 'ratio' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="ratio">Fixed Ratio (%)</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                </TooltipTrigger>
                                                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      Buy at a fixed ratio. 120% means 1.2 times the copied order. 
                                      It won't exceed your set Max Buy Amount.
                                      <br /><br />
                                      E.g. Enter 200%. Max Buy Amount is 0.5 ETH. If copied wallet 
                                      buys 0.1 ETH, you buy 0.2 ETH. If it buys 0.3 ETH, you buy 0.5 ETH.
                                    </p>
                                  </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            id="ratio"
                            type="number"
                            step="1"
                            value={settings.copyBuy.ratio}
                            onChange={(e) => updateSettings('copyBuy.ratio', e.target.value)}
                            placeholder="100"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="maxAmountRatio">Max Buy Amount (ETH)</Label>
                          <Input
                            id="maxAmountRatio"
                            type="number"
                            step="0.1"
                            value={settings.copyBuy.maxAmount}
                            onChange={(e) => updateSettings('copyBuy.maxAmount', e.target.value)}
                            placeholder="1.0"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="copySellEnabled">Copy Sells</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Automatically copy sell orders from the target wallet
                    </p>
                  </div>
                  <Switch
                    id="copySellEnabled"
                    checked={settings.copySell.enabled}
                    onCheckedChange={(checked) => {
                      updateSettings('copySell.enabled', checked)
                      // Clear error when user enables copy sell
                      if (errors.copyOptions) {
                        setErrors(prev => ({ ...prev, copyOptions: '' }))
                      }
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Custom Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Custom Settings</span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                    <Label htmlFor="slippage">Slippage (%)</Label>
                    <Input
                      id="slippage"
                      type="number"
                      step="0.1"
                      value={settings.customSettings.slippage}
                      onChange={(e) => {
                        updateSettings('customSettings.slippage', e.target.value)
                        // Clear error when user starts typing
                        if (errors.slippage) {
                          setErrors(prev => ({ ...prev, slippage: '' }))
                        }
                      }}
                      placeholder="2.0"
                      className={errors.slippage ? 'border-red-500' : ''}
                    />
                    {errors.slippage && (
                      <p className="text-sm text-red-500">{errors.slippage}</p>
                    )}
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="priorityFee">Priority Fee (ETH)</Label>
                  <Input
                    id="priorityFee"
                    type="number"
                    step="0.001"
                    value={settings.customSettings.priorityFee}
                    onChange={(e) => updateSettings('customSettings.priorityFee', e.target.value)}
                    placeholder="0.001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="antiMevRpc">Anti-MEV RPC</Label>
                  <Switch
                    id="antiMevRpc"
                    checked={settings.customSettings.antiMevRpc}
                    onCheckedChange={(checked) => updateSettings('customSettings.antiMevRpc', checked)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use anti-MEV RPC to reduce front-running and sandwich attacks
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customRpc">Custom RPC URL (Optional)</Label>
                <Input
                  id="customRpc"
                  value={settings.customSettings.customRpc}
                  onChange={(e) => updateSettings('customSettings.customRpc', e.target.value)}
                  placeholder="https://your-custom-rpc.com"
                />
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Note: Ensure your account has enough balance for auto trading to run smoothly.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleConfirm} 
              variant="primary" 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Copy Trade'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default CopyTradeSheet 
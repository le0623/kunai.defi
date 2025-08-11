import { useState } from 'react'
import { Wallet, AlertTriangle } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Card, CardContent } from '@/components/ui/card'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setIsDepositSheetOpen } from '@/store/slices/uiSlice'
import CopyIcon from '@/components/common/copy'

interface DepositSheetProps {
  children?: React.ReactNode
}

// Simple QR Code component using SVG
const QRCode: React.FC<{ value: string; size?: number }> = ({ value, size = 200 }) => {
  // This is a simplified QR code representation
  // In production, you should use a proper QR code library like qrcode.react
  const qrData = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`
  
  return (
    <div className="flex justify-center">
      <div className="p-2 rounded-lg bg-white">
        <img 
          src={qrData} 
          alt="QR Code" 
          width={size}
          height={size}
        />
      </div>
    </div>
  )
}

const DepositSheet: React.FC<DepositSheetProps> = ({ children }) => {
  const auth = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const ui = useAppSelector((state) => state.ui)

  // Get the user's in-app wallet address
  const depositAddress = auth.user?.inAppWallet || auth.user?.address || "No wallet address available"

  return (
    <Sheet open={ui.isDepositSheetOpen} onOpenChange={(open) => dispatch(setIsDepositSheetOpen(open))}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Deposit Funds
          </SheetTitle>
          <SheetDescription>
            {depositAddress !== "No wallet address available" 
              ? "Scan the QR code or copy the address to deposit ETH"
              : "Please connect your wallet to deposit funds"
            }
          </SheetDescription>
        </SheetHeader>

        {/* QR Code Section */}
        {depositAddress !== "No wallet address available" ? (
          <Card className="bg-transparent m-4">
            <CardContent className="p-4">
              <div className="space-y-4">
                <QRCode value={depositAddress} size={180} />
                {/* Address Display */}
                <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="font-mono text-sm break-all">{depositAddress}</span>
                  <CopyIcon clipboardText={depositAddress} />
                </div>
                <div className="flex items-start gap-1 text-yellow-800 dark:text-yellow-200 text-sm">
                  <AlertTriangle className="h-5 w-5 text-yellow-800 dark:text-yellow-200 mt-0.5 flex-shrink-0" />
                  This address only supports ETH deposits via the Ethereum network. Please do not use other networks to avoid any loss of funds.
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-transparent m-4">
            <CardContent className="p-4">
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No wallet address available</p>
                <p className="text-sm">Please connect your wallet to deposit funds</p>
              </div>
            </CardContent>
          </Card>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default DepositSheet

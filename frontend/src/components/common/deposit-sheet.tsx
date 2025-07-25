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

  // Mock Solana address - replace with actual address from your system
  const depositAddress = auth.user?.address || "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"

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
            Scan the QR code or copy the address to deposit ETH
          </SheetDescription>
        </SheetHeader>

        {/* QR Code Section */}
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
      </SheetContent>
    </Sheet>
  )
}

export default DepositSheet

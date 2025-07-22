import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { closeModal } from '@/store/slices/uiSlice'
import { Button } from '@/components/ui/button'
import Input from '@/components/common/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
import PresetsTabs from '@/components/common/PresetsTabs'

const PresetsSettingsModal: React.FC = () => {
  const dispatch = useAppDispatch()
  const { activeModal } = useAppSelector((state) => state.ui)
  
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [clipboardQuickBuy, setClipboardQuickBuy] = useState('')

  const isOpen = activeModal === 'presets-settings'

  const handleClose = () => {
    dispatch(closeModal())
  }

  const handleCopyClipboard = () => {
    navigator.clipboard.readText().then(text => {
      setClipboardQuickBuy(text)
    }).catch(err => {
      console.error('Failed to read clipboard:', err)
    })
  }

  const handleSavePreset = () => {
    console.log('Save Preset')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Presets Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'buy' | 'sell')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger className="border-none cursor-pointer selection:text-green-500" value="buy">Buy</TabsTrigger>
            <TabsTrigger className="border-none cursor-pointer selection:text-red-500" value="sell">Sell</TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-6">
            {/* Clipboard Quick Buy Section */}
            <div>
              <Label htmlFor="clipboard-quick-buy">Clipboard Quick Buy</Label>
              <Input
                value={clipboardQuickBuy}
                id="clipboard-quick-buy"
                onChange={(e) => setClipboardQuickBuy(e.target.value)}
                placeholder="Paste token address or contract here..."
                className="flex-1 mt-2"
              />
            </div>

            {/* Presets Tabs */}
            <PresetsTabs type="buy" />
          </TabsContent>

          <TabsContent value="sell" className="space-y-6">
            {/* Presets Tabs */}
            <PresetsTabs type="sell" />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="flex-1">Close</Button>
          <Button onClick={handleSavePreset} className="flex-1">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PresetsSettingsModal 
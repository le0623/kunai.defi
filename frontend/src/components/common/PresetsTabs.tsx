import React from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setSelectedPreset, updatePreset, type Preset } from '@/store/slices/presetsSlice'
import Input from '@/components/common/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PresetsTabsProps {
  type: 'buy' | 'sell'
}

const PresetsTabs: React.FC<PresetsTabsProps> = ({ type }) => {
  const dispatch = useAppDispatch()
  const { presets, selectedPreset } = useAppSelector((state) => state.presets)

  const handlePresetSelect = (presetId: string) => {
    dispatch(setSelectedPreset(presetId))
  }

  const handlePresetChange = (presetId: string, field: keyof Preset['settings'], value: any) => {
    dispatch(updatePreset({
      id: presetId,
      settings: { [field]: value }
    }))
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{type === 'buy' ? 'Buy' : 'Sell'} Presets</h3>
      <Tabs value={selectedPreset} onValueChange={handlePresetSelect}>
        <TabsList className="grid w-full grid-cols-3">
          {presets.map((preset) => (
            <TabsTrigger 
              className="border-none cursor-pointer selection:text-green-500" 
              key={preset.id} 
              value={preset.id}
            >
              {preset.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {presets.map((preset) => (
          <TabsContent key={preset.id} value={preset.id} className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                    {preset.name}
                  </div>
                  <div>
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {preset.settings.slippage}% slippage • {preset.settings.gasLimit / 1000000} Gwei gas
                    </p>
                  </div>
                </div>
                
                {/* Editable Settings */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`slippage-${preset.id}`}>Slippage Limit</Label>
                      <Input
                        id={`slippage-${preset.id}`}
                        type="number"
                        value={preset.settings.slippage}
                        onChange={(e) => handlePresetChange(preset.id, 'slippage', parseFloat(e.target.value))}
                        placeholder="2.0"
                        suffixComp={<span className="text-white/50">%</span>}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`gas-${preset.id}`}>Gas</Label>
                      <Input
                        id={`gas-${preset.id}`}
                        type="number"
                        value={preset.settings.gasLimit / 1000000}
                        onChange={(e) => handlePresetChange(preset.id, 'gasLimit', parseInt(e.target.value) * 1000000)}
                        placeholder="1.62"
                        suffixComp={<span className="text-white/50">Gwei</span>}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`custom-gas-${preset.id}`}>Or set custom gas (Min: 1.62 Gwei)</Label>
                    <Input
                      id={`custom-gas-${preset.id}`}
                      type="number"
                      step="0.01"
                      value={preset.settings.gasLimit / 1000000}
                      onChange={(e) => handlePresetChange(preset.id, 'gasLimit', parseInt(e.target.value) * 1000000)}
                      placeholder="1.62"
                      suffixComp={<span className="text-white/50">Gwei</span>}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`anti-mev-${preset.id}`}
                      checked={preset.settings.antiMev || false}
                      onCheckedChange={(checked) => handlePresetChange(preset.id, 'antiMev', checked)}
                    />
                    <Label htmlFor={`anti-mev-${preset.id}`}>Anti-MEV RPC</Label>
                  </div>

                  {type === 'buy' && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`auto-approve-${preset.id}`}
                        checked={preset.settings.autoApprove}
                        onCheckedChange={(checked) => handlePresetChange(preset.id, 'autoApprove', checked)}
                      />
                      <Label htmlFor={`auto-approve-${preset.id}`}>Auto Approval</Label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default PresetsTabs 
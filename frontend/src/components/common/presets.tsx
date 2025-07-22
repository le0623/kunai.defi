import { cn } from "@/lib/utils"
import { Settings } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setSelectedPreset } from "@/store/slices/presetsSlice"
import { usePresetsModal } from "@/hooks/usePresetsModal"

const Presets = () => {
  const dispatch = useAppDispatch()
  const { presets, selectedPreset } = useAppSelector((state) => state.presets)
  const { openPresetsModal } = usePresetsModal()

  const handlePresetClick = (presetId: string) => {
    dispatch(setSelectedPreset(presetId))
  }

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    openPresetsModal()
  }

  return (
    <div className="flex gap-1 items-center bg-accent p-0.5 rounded-xs">
      {presets.map((preset) => (
        <div 
          key={preset.id} 
          className={cn(
            "text-xs text-muted-foreground cursor-pointer px-1 py-0.5", 
            selectedPreset === preset.id && "text-white bg-white/10 rounded-xs"
          )} 
          onClick={() => handlePresetClick(preset.id)}
        >
          {preset.name}
        </div>
      ))}
      <div className="px-1 py-0.5">
        <Settings 
          className="text-muted-foreground cursor-pointer hover:text-white transition-colors" 
          size={16} 
          onClick={handleSettingsClick}
        />
      </div>
    </div>
  )
}

export default Presets
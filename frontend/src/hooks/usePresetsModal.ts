import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { openModal, closeModal } from '@/store/slices/uiSlice'

export const usePresetsModal = () => {
  const dispatch = useAppDispatch()
  const { activeModal } = useAppSelector((state) => state.ui)
  const { presets, selectedPreset } = useAppSelector((state) => state.presets)

  const isOpen = activeModal === 'presets-settings'
  const currentPreset = presets.find(p => p.id === selectedPreset)

  const openPresetsModal = () => {
    dispatch(openModal('presets-settings'))
  }

  const closePresetsModal = () => {
    dispatch(closeModal())
  }

  return {
    isOpen,
    currentPreset,
    presets,
    selectedPreset,
    openPresetsModal,
    closePresetsModal,
  }
} 
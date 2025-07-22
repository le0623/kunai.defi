import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface Preset {
  id: string
  name: string
  value: number
  settings: {
    slippage: number
    gasLimit: number
    maxAmount: string
    autoApprove: boolean
    antiMev: boolean
  }
}

export interface PresetsState {
  presets: Preset[]
  selectedPreset: string
  isLoading: boolean
  error: string | null
}

const defaultPresets: Preset[] = [
  {
    id: 'p1',
    name: 'P1',
    value: 1,
    settings: {
      slippage: 2,
      gasLimit: 300000,
      maxAmount: '0.1',
      autoApprove: true,
      antiMev: false,
    },
  },
  {
    id: 'p2',
    name: 'P2',
    value: 2,
    settings: {
      slippage: 5,
      gasLimit: 500000,
      maxAmount: '0.5',
      autoApprove: false,
      antiMev: false,
    },
  },
  {
    id: 'p3',
    name: 'P3',
    value: 3,
    settings: {
      slippage: 10,
      gasLimit: 800000,
      maxAmount: '1.0',
      autoApprove: false,
      antiMev: false,
    },
  },
]

const initialState: PresetsState = {
  presets: defaultPresets,
  selectedPreset: 'p1',
  isLoading: false,
  error: null,
}

const presetsSlice = createSlice({
  name: 'presets',
  initialState,
  reducers: {
    setSelectedPreset: (state, action: PayloadAction<string>) => {
      state.selectedPreset = action.payload
    },
    updatePreset: (state, action: PayloadAction<{ id: string; settings: Partial<Preset['settings']> }>) => {
      const preset = state.presets.find(p => p.id === action.payload.id)
      if (preset) {
        preset.settings = { ...preset.settings, ...action.payload.settings }
      }
    },
    addPreset: (state, action: PayloadAction<Omit<Preset, 'id'>>) => {
      const id = `p${state.presets.length + 1}`
      state.presets.push({ ...action.payload, id })
    },
    removePreset: (state, action: PayloadAction<string>) => {
      state.presets = state.presets.filter(preset => preset.id !== action.payload)
      if (state.selectedPreset === action.payload) {
        state.selectedPreset = state.presets[0]?.id || 'p1'
      }
    },
    updatePresetName: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const preset = state.presets.find(p => p.id === action.payload.id)
      if (preset) {
        preset.name = action.payload.name
      }
    },
    updatePresetValue: (state, action: PayloadAction<{ id: string; value: number }>) => {
      const preset = state.presets.find(p => p.id === action.payload.id)
      if (preset) {
        preset.value = action.payload.value
      }
    },
    resetPresets: (state) => {
      state.presets = defaultPresets
      state.selectedPreset = 'p1'
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  setSelectedPreset,
  updatePreset,
  addPreset,
  removePreset,
  updatePresetName,
  updatePresetValue,
  resetPresets,
  setLoading,
  setError,
  clearError,
} = presetsSlice.actions

export default presetsSlice.reducer 
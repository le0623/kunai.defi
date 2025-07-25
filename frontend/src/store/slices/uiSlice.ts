import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  activeModal: string | null
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
  }>
  loadingStates: {
    [key: string]: boolean
  }
  selectedChain: string
  isWindowFocused: boolean
  isDepositSheetOpen: boolean
}

const initialState: UIState = {
  theme: 'dark',
  sidebarOpen: false,
  mobileMenuOpen: false,
  activeModal: null,
  notifications: [],
  loadingStates: {},
  selectedChain: 'ethereum',
  isWindowFocused: true,
  isDepositSheetOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload
    },
    closeModal: (state) => {
      state.activeModal = null
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id'>>) => {
      const id = Date.now().toString()
      state.notifications.push({
        ...action.payload,
        id,
        duration: action.payload.duration || 5000,
      })
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      )
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    setLoadingState: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loadingStates[action.payload.key] = action.payload.loading
    },
    clearLoadingState: (state, action: PayloadAction<string>) => {
      delete state.loadingStates[action.payload]
    },
    setSelectedChain: (state, action: PayloadAction<string>) => {
      state.selectedChain = action.payload
    },
    setWindowFocus: (state, action: PayloadAction<boolean>) => {
      state.isWindowFocused = action.payload
    },
    setIsDepositSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.isDepositSheetOpen = action.payload
    },
  },
})

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoadingState,
  clearLoadingState,
  setSelectedChain,
  setWindowFocus,
  setIsDepositSheetOpen,
} = uiSlice.actions

export default uiSlice.reducer 
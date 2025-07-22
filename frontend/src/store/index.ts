import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import walletReducer from './slices/walletSlice'
import poolsReducer from './slices/poolsSlice'
import uiReducer from './slices/uiSlice'
import presetsReducer from './slices/presetsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    wallet: walletReducer,
    pools: poolsReducer,
    ui: uiReducer,
    presets: presetsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 
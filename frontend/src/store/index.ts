import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './slices/authSlice'
import walletReducer from './slices/walletSlice'
import poolsReducer from './slices/poolsSlice'
import uiReducer from './slices/uiSlice'
import presetsReducer from './slices/presetsSlice'
import otherReducer from './slices/otherSlice'

// Configure persistence for the 'other' slice
const otherPersistConfig = {
  key: 'other',
  storage,
  whitelist: ['selectedChain', 'referralCode'] // Only persist these fields
}

// Configure persistence for the 'auth' slice (optional)
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token', 'isAuthenticated'] // Only persist these fields
}

// Combine reducers with persistence
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  wallet: walletReducer,
  pools: poolsReducer,
  ui: uiReducer,
  presets: presetsReducer,
  other: persistReducer(otherPersistConfig, otherReducer),
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for redux-persist
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PAUSE', 'persist/PURGE', 'persist/REGISTER', 'persist/FLUSH'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
})

export const persistor = persistStore(store)

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 
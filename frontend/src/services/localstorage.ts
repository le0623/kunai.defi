import { useEffect } from 'react'

// Custom event for localStorage changes
const STORAGE_CHANGE_EVENT = 'localStorageChange'

// Custom localStorage wrapper that dispatches events
export const storageService = {
  setItem: (key: string, value: string) => {
    const oldValue = localStorage.getItem(key)
    localStorage.setItem(key, value)

    // Dispatch custom event for same-tab changes
    window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, {
      detail: {
        key,
        newValue: value,
        oldValue,
        type: 'set'
      }
    }))
  },

  removeItem: (key: string) => {
    const oldValue = localStorage.getItem(key)
    localStorage.removeItem(key)

    // Dispatch custom event for same-tab changes
    window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, {
      detail: {
        key,
        newValue: null,
        oldValue,
        type: 'remove'
      }
    }))
  },

  getItem: (key: string) => {
    return localStorage.getItem(key)
  },

  clear: () => {
    const oldData = { ...localStorage }
    localStorage.clear()

    // Dispatch events for all cleared items
    Object.keys(oldData).forEach(key => {
      window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, {
        detail: {
          key,
          newValue: null,
          oldValue: oldData[key],
          type: 'clear'
        }
      }))
    })
  }
}

// Hook to listen for localStorage changes (same tab)
export function useStorageListener(
  key: string,
  callback: (newValue: string | null, oldValue: string | null) => void
) {
  useEffect(() => {
    const handleStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        callback(e.detail.newValue, e.detail.oldValue)
      }
    }

    // Listen for custom events (same tab)
    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageChange as EventListener)

    // Listen for storage events (other tabs)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === key) {
        callback(e.newValue, e.oldValue)
      }
    }
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageChange as EventListener)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [key, callback])
}

// Hook to listen for multiple localStorage keys
export function useMultiStorageListener(
  keys: string[],
  callback: (key: string, newValue: string | null, oldValue: string | null) => void
) {
  useEffect(() => {
    const handleStorageChange = (e: CustomEvent) => {
      if (keys.includes(e.detail.key)) {
        callback(e.detail.key, e.detail.newValue, e.detail.oldValue)
      }
    }

    // Listen for custom events (same tab)
    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageChange as EventListener)

    // Listen for storage events (other tabs)
    const handleStorageEvent = (e: StorageEvent) => {
      if (keys.includes(e.key || '')) {
        callback(e.key || '', e.newValue, e.oldValue)
      }
    }
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageChange as EventListener)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [keys, callback])
}

// Utility function to set auth token with event
export const setAuthToken = (token: string | null) => {
  if (token) {
    storageService.setItem('authToken', token)
  } else {
    storageService.removeItem('authToken')
  }
}

// Utility function to get auth token
export const getAuthToken = () => {
  return storageService.getItem('authToken')
}

// Utility function to remove auth token
export const removeAuthToken = () => {
  storageService.removeItem('authToken')
}

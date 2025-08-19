import { useRef, useCallback } from 'react'

export const usePanelPosition = () => {
  const footerRef = useRef<HTMLElement>(null)

  const calculatePanelPosition = useCallback((footerItemElement: HTMLElement) => {
    if (!footerItemElement || !footerRef.current) {
      return { x: 100, y: 100 } // Default position
    }

    const footerRect = footerRef.current.getBoundingClientRect()
    const itemRect = footerItemElement.getBoundingClientRect()
    
    // Calculate position to align panel bottom with footer top
    const x = itemRect.left + (itemRect.width / 2) - 200 // Center panel on footer item, assuming 400px panel width
    const y = footerRect.top - 400 // Position panel above footer, assuming 400px panel height
    
    // Ensure panel stays within viewport bounds
    const maxX = window.innerWidth - 400
    const maxY = window.innerHeight - 400
    
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    }
  }, [])

  return {
    footerRef,
    calculatePanelPosition
  }
} 
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ZoomIn } from 'lucide-react'

interface TooltipImageProps {
  src?: string
  thumbnail?: string
  alt: string
  size?: number
  tooltipSize?: number
  className?: string
  tooltipClassName?: string
}

export function TooltipImage({ 
  src, 
  thumbnail,
  alt, 
  size = 64, 
  tooltipSize = 256, 
  className = "rounded-full",
  tooltipClassName = "rounded-lg"
}: TooltipImageProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, arrowPosition: 'left' as 'left' | 'right' | 'bottom' })
  const imageRef = useRef<HTMLDivElement>(null)
  
  const handleMouseEnter = () => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect()
      const tooltipWidth = tooltipSize // image size
      const tooltipHeight = tooltipSize // image size
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      
      // Calculate initial position (below and right)
      let x = rect.right + 4
      let y = rect.bottom + 4
      let arrowPosition = 'left' // Default arrow position
      
      // Check if tooltip would go off the right edge
      if (x + tooltipWidth > windowWidth) {
        x = rect.left - tooltipWidth - 4 // Position to the left instead
        arrowPosition = 'right'
      }
      
      // Check if tooltip would go off the bottom edge
      if (y + tooltipHeight > windowHeight) {
        y = rect.top - tooltipHeight - 4 // Position above instead
        arrowPosition = 'bottom'
      }
      
      setTooltipPosition({ x, y, arrowPosition: arrowPosition as 'left' | 'right' | 'bottom' })
    }
    setShowTooltip(true)
  }
  
  const handleMouseLeave = () => {
    setShowTooltip(false)
  }
  
  return (
    <>
      <div 
        ref={imageRef}
        className="relative group cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img 
          src={thumbnail || src} 
          alt={alt} 
          className={`transition-opacity duration-200 group-hover:opacity-70 ${className}`}
          style={{ width: `${size}px`, height: `${size}px` }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
        </div>
      </div>
      
      {/* Global Tooltip Portal */}
      {showTooltip && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none border border-muted bg-black rounded-lg"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translate(0, 0)'
          }}
        >
          <img
            src={src} 
            alt={alt} 
            className={tooltipClassName}
            style={{ width: `${tooltipSize}px`, height: `${tooltipSize}px`, objectFit: 'contain' }}
          />
        </div>,
        document.body
      )}
    </>
  )
} 
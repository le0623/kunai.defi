import React, { useRef, useEffect, useState, useCallback } from 'react'
import Draggable from 'react-draggable'
import { X, GripHorizontal } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { closePanel, updatePanelPosition } from '@/store/slices/uiSlice'
import { cn } from '@/lib/utils'

interface DraggablePanelProps {
  panelId: string
  title?: string
  children: React.ReactNode
  className?: string
  defaultPosition?: { x: number; y: number }
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

const DraggablePanel: React.FC<DraggablePanelProps> = ({
  panelId,
  title,
  children,
  className,
  defaultPosition = { x: 0, y: 0 },
  minWidth = 300,
  minHeight = 200,
  maxWidth = 800,
  maxHeight = 600,
}) => {
  const dispatch = useDispatch()
  const panelState = useSelector((state: RootState) => state.ui.panels[panelId])
  const [isDragging, setIsDragging] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  // Initialize panel position if not set
  useEffect(() => {
    if (!panelState?.position) {
      dispatch(updatePanelPosition({ panelId, position: defaultPosition }))
    }
  }, [panelId, panelState?.position, defaultPosition, dispatch])

  const handleClose = useCallback(() => {
    dispatch(closePanel(panelId))
  }, [dispatch, panelId])

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDragStop = useCallback((e: any, data: any) => {
    setIsDragging(false)
    dispatch(updatePanelPosition({ 
      panelId, 
      position: { x: data.x, y: data.y } 
    }))
  }, [dispatch, panelId])

  // Don't render if panel is not open
  if (!panelState?.isOpen) {
    return null
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".drag-handle"
      position={panelState.position}
      onStart={handleDragStart}
      onStop={handleDragStop}
      bounds="body"
    >
      <div
        ref={nodeRef}
        className={cn(
          "fixed z-50 bg-background border border-border rounded-lg shadow-lg",
          "min-w-[300px] min-h-[200px] max-w-[800px] max-h-[600px]",
          "flex flex-col",
          isDragging && "select-none",
          className
        )}
        style={{
          minWidth: `${minWidth}px`,
          minHeight: `${minHeight}px`,
          maxWidth: `${maxWidth}px`,
          maxHeight: `${maxHeight}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-4 h-4 text-muted-foreground drag-handle cursor-move" />
            {title && (
              <h3 className="text-sm font-medium text-foreground">{title}</h3>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    </Draggable>
  )
}

export default DraggablePanel 
import React from 'react'
import { useSocketIO } from '@/contexts/SocketIOContext'
import { cn } from '@/lib/utils'

export const SocketIOStatus: React.FC = () => {
  const { isConnected, isConnecting } = useSocketIO()

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <div className={cn("text-white px-2 py-1 rounded-sm text-xs", isConnected ? 'bg-green-400/20' : isConnecting ? 'bg-yellow-400/20' : 'bg-red-400/20')}>
      <div className="flex items-center gap-1">
        <div 
          className={cn("w-2 h-2 rounded-full", isConnected ? 'bg-green-400' : isConnecting ? 'bg-yellow-400' : 'bg-red-400')} 
        />
        {isConnected ? 'Stable' : isConnecting ? 'Unstable' : 'Unstable'}
      </div>
    </div>
  )
} 
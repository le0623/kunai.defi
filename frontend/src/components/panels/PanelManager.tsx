import React from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import WalletTrackerPanel from './WalletTrackerPanel'
import HoldingPanel from './HoldingPanel'

// Panel component mapping
const PANEL_COMPONENTS: Record<string, React.ComponentType<{ panelId: string }>> = {
  'wallet-tracker': WalletTrackerPanel,
  'holding': HoldingPanel,
  // Add more panel components here as needed
  // 'watchlist': WatchlistPanel,
  // 'trending': TrendingPanel,
  // 'tracker': TrackerPanel,
  // 'pnl': PnLPanel,
}

const PanelManager: React.FC = () => {
  const panels = useSelector((state: RootState) => state.ui.panels)

  return (
    <>
      {Object.entries(panels).map(([panelId, panelState]) => {
        if (!panelState.isOpen) return null

        const PanelComponent = PANEL_COMPONENTS[panelId]
        if (!PanelComponent) {
          console.warn(`No component found for panel: ${panelId}`)
          return null
        }

        return <PanelComponent key={panelId} panelId={panelId} />
      })}
    </>
  )
}

export default PanelManager 
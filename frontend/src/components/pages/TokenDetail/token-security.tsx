import { useEffect, useState } from "react"
import type { TokenSecurityInfo } from "@kunai/shared"
import { tokenAPI } from "@/services/api"
import { useParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, AlertCircle, CheckCircle, XCircle } from "lucide-react"

export const TokenSecurity = () => {
  const { chain, tokenAddress } = useParams<{ chain: string; tokenAddress: string }>()
  const [security, setSecurity] = useState<TokenSecurityInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Load security data
  useEffect(() => {
    const loadSecurity = async () => {
      if (!chain || !tokenAddress) return

      try {
        setLoading(true)
        const security = await tokenAPI.getTokenSecurity('1', tokenAddress)
        setSecurity(security)
      } catch (error) {
        console.error('Error loading security:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSecurity()
  }, [chain, tokenAddress])

  const getSecurityStatus = (value: string) => {
    return value === '1' ? 'danger' : 'safe'
  }

  const getSecurityIcon = (value: string) => {
    return value === '1' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />
  }

  const getSecurityColor = (value: string) => {
    return value === '1' ? 'destructive' : 'default'
  }

  const getSecurityTextColor = (value: string) => {
    return value === '1' ? 'text-red-600' : 'text-green-600'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="w-4 h-4" />
          Security Analysis
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!security) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="w-4 h-4" />
          Security Analysis
        </div>
        <div className="text-center py-4 text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Security data not available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="w-4 h-4" />
        Security Analysis
      </div>
      
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Token Info</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{security.token_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Symbol:</span>
              <span className="font-medium">{security.token_symbol}</span>
            </div> */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Supply:</span>
              <span className="font-medium">{security.total_supply}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Holders:</span>
              <span className="font-medium">{security.holder_count}</span>
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Tax Information</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Buy Tax:</span>
              <span className={`font-medium ${parseFloat(security.buy_tax) > 10 ? 'text-red-500' : 'text-green-500'}`}>
                {security.buy_tax}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sell Tax:</span>
              <span className={`font-medium ${parseFloat(security.sell_tax) > 10 ? 'text-red-500' : 'text-green-500'}`}>
                {security.sell_tax}%
              </span>
            </div>
          </div>
        </div>

        {/* Security Flags */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Security Flags</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between p-2 rounded text-xs border">
              <div className={`flex items-center gap-2 ${getSecurityTextColor(security.is_honeypot)}`}>
                {getSecurityIcon(security.is_honeypot)}
                <span>Honeypot</span>
              </div>
              <Badge variant={getSecurityColor(security.is_honeypot)}>
                {getSecurityStatus(security.is_honeypot)}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 rounded text-xs border">
              <div className={`flex items-center gap-2 ${getSecurityTextColor(security.is_proxy)}`}>
                {getSecurityIcon(security.is_proxy)}
                <span>Proxy Contract</span>
              </div>
              <Badge variant={getSecurityColor(security.is_proxy)}>
                {getSecurityStatus(security.is_proxy)}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 rounded text-xs border">
              <div className={`flex items-center gap-2 ${getSecurityTextColor(security.is_mintable)}`}>
                {getSecurityIcon(security.is_mintable)}
                <span>Mintable</span>
              </div>
              <Badge variant={getSecurityColor(security.is_mintable)}>
                {getSecurityStatus(security.is_mintable)}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 rounded text-xs border">
              <div className={`flex items-center gap-2 ${getSecurityTextColor(security.is_open_source)}`}>
                {getSecurityIcon(security.is_open_source)}
                <span>Open Source</span>
              </div>
              <Badge variant={getSecurityColor(security.is_open_source)}>
                {getSecurityStatus(security.is_open_source)}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 rounded text-xs border">
              <div className={`flex items-center gap-2 ${getSecurityTextColor(security.is_blacklisted)}`}>
                {getSecurityIcon(security.is_blacklisted)}
                <span>Blacklisted</span>
              </div>
              <Badge variant={getSecurityColor(security.is_blacklisted)}>
                {getSecurityStatus(security.is_blacklisted)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Additional Risks */}
        {(security.note || security.other_potential_risks) && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Additional Risks</h4>
            <div className="space-y-2 text-xs">
              {security.note && (
                <div className="p-2 border border-yellow-200 rounded">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-800">{security.note}</span>
                  </div>
                </div>
              )}
              {security.other_potential_risks && (
                <div className="p-2 border border-orange-200 rounded">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-orange-800">{security.other_potential_risks}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEX Information
        {security.dex && security.dex.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">DEX Information</h4>
            <div className="space-y-1 text-xs">
              {security.dex.map((dex, index) => (
                <div key={index} className="flex justify-between items-center p-1">
                  <span className="text-muted-foreground">{dex.name}</span>
                  <span className="font-medium">{dex.liquidity}</span>
                </div>
              ))}
            </div>
          </div>
        )} */}
      </div>
    </div>
  )
}
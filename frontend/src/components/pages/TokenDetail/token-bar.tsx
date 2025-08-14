import { type KunaiTokenInfo } from "@kunai/shared"
import { formatAddress } from "@kunai/shared"
import { Link } from "react-router-dom"
import { Search, Share2Icon, StarIcon } from "lucide-react"
import CopyIcon from "@/components/common/copy"
import { Separator } from "@/components/ui/separator"
import { Icon } from "@/lib/icon"
import { cn, formatNumber } from "@/lib/utils"

const TokenBar = ({ tokenInfo }: { tokenInfo: KunaiTokenInfo }) => {
  const isBearish = tokenInfo?.moralisTokenAnalytics?.pricePercentChange["24h"] < 0;
  return (
    <div className="border-b bg-card p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <StarIcon className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
              {tokenInfo?.moralisToken?.logo ? (
                <img src={tokenInfo.moralisToken.logo} alt={tokenInfo.moralisToken.symbol} className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 bg-black border border-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{tokenInfo?.moralisToken?.symbol?.slice(0, 2)}</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-end gap-1">
                <h2 className="font-semibold">{tokenInfo?.moralisToken?.symbol}</h2>
                <p className="text-sm text-muted-foreground">{tokenInfo?.moralisToken?.name}</p>
              </div>
              <div className="flex items-center gap-1">
                <p className="text-sm text-muted-foreground">{formatAddress(tokenInfo?.moralisToken?.address || '')}</p>
                <CopyIcon clipboardText={tokenInfo?.moralisToken?.address || ''} />
                <Separator orientation="vertical" className="h-4" />
                { Object.entries(tokenInfo?.moralisToken?.links || {}).map(([key, link]: [string, string]) => {
                  return (
                    <Link to={link} target="_blank" className="cursor-pointer">
                      <Icon icon={key} className="w-4 h-4" />
                    </Link>
                  )
                })}
                <Link to={`https://etherscan.io/address/${tokenInfo?.moralisToken?.address}`} target="_blank" className="cursor-pointer">
                  <img src="/icon/etherscan.svg" alt="Etherscan" className="w-4 h-4 hover:brightness-150" />
                </Link>
                <Link to={`https://x.com/search?q=$${tokenInfo?.moralisToken?.symbol}`} target="_blank" className="flex items-center gap-0.5 cursor-pointer text-muted-foreground hover:text-foreground">
                  <Search className="w-4 h-4" />
                  <span className="text-sm">Name</span>
                </Link>
                <Link to={`https://x.com/search?q=${tokenInfo?.moralisToken?.address}`} target="_blank" className="flex items-center gap-0.5 cursor-pointer text-muted-foreground hover:text-foreground">
                  <Search className="w-4 h-4" />
                  <span className="text-sm">CA</span>
                </Link>
                <Share2Icon className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex flex-col items-end justify-between">
            <p className={cn("text-muted-foreground", isBearish ? "text-red-500" : "text-green-500")}>${tokenInfo?.moralisTokenAnalytics?.usdPrice}</p>
            <p className="text-sm font-semibold">MC: ${formatNumber(Number(tokenInfo?.moralisToken?.market_cap))}</p>
          </div>
          <div className="flex flex-col items-center justify-between">
            <p className="text-sm text-muted-foreground">Liq</p>
            <p className="text-sm font-semibold">${formatNumber(Number(tokenInfo?.moralisTokenAnalytics?.totalLiquidityUsd))}</p>
          </div>
          <div className="flex flex-col items-center justify-between">
            <p className="text-sm text-muted-foreground">24h Vol</p>
            <p className="text-sm font-semibold">${formatNumber(Number(tokenInfo?.tokenInfo?.attributes.volume_usd.h24))}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenBar
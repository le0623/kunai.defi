import { cn } from "@/lib/utils";
import { formatNumber, type KunaiTokenInfo, type ShortTimeSeries } from "@kunai/shared";

const TokenAnalytics = ({ token }: { token: KunaiTokenInfo }) => {

  return (
    <div className="flex flex-col gap-2 p-3">
      {(['5m','1h','6h','24h'] as (keyof ShortTimeSeries)[]).map((timeframe) => {
        const { moralisTokenAnalytics } = token
        const volume = (moralisTokenAnalytics?.totalBuyVolume?.[timeframe] ?? 0) + (moralisTokenAnalytics?.totalSellVolume?.[timeframe] ?? 0)
        const netVolume = (moralisTokenAnalytics?.totalBuyVolume?.[timeframe] ?? 0) - (moralisTokenAnalytics?.totalSellVolume?.[timeframe] ?? 0)
        const buyVolume = moralisTokenAnalytics?.totalBuyVolume?.[timeframe] ?? 0
        const sellVolume = moralisTokenAnalytics?.totalSellVolume?.[timeframe] ?? 0
        const totalVolume = buyVolume + sellVolume
        const buyPercentage = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 0
        const sellPercentage = totalVolume > 0 ? (sellVolume / totalVolume) * 100 : 0

        return (
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-7 gap-2 text-xs">
              <div className="flex flex-col items-start gap-1 col-span-1">
                <p className="text-muted-foreground">{timeframe} Vol</p>
                <p className="font-semibold">{formatNumber(volume)}</p>
              </div>
              <div className="flex flex-col items-center gap-1 col-span-2">
                <p className="text-muted-foreground">Buys</p>
                <div className="flex items-center text-green-500">
                  <span className="font-semibold">{formatNumber(moralisTokenAnalytics?.totalBuys?.[timeframe] ?? 0, 1)}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-semibold">${formatNumber(moralisTokenAnalytics?.totalBuyVolume?.[timeframe] ?? 0, 1)}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 col-span-2">
                <p className="text-muted-foreground">Sells</p>
                <div className="flex items-center text-red-500">
                  <span className="font-semibold">{formatNumber(moralisTokenAnalytics?.totalSells?.[timeframe] ?? 0, 1)}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-semibold">${formatNumber(moralisTokenAnalytics?.totalSellVolume?.[timeframe] ?? 0, 1)}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 col-span-1">
                <p className="text-muted-foreground">Net Vol</p>
                <p className={cn("font-semibold", netVolume < 0 ? 'text-red-500' : 'text-green-500')}>{netVolume < 0 ? '-' : ''}${formatNumber(Math.abs(netVolume), 1)}</p>
              </div>
              <div className="flex flex-col items-end gap-1 col-span-1">
                <p className="text-muted-foreground">Price</p>
                <p className={cn("font-semibold", token.moralisTokenAnalytics?.pricePercentChange?.[timeframe] ?? 0 < 0 ? 'text-red-500' : 'text-green-500')}>{token.moralisTokenAnalytics?.pricePercentChange?.[timeframe].toFixed(2) ?? 0}%</p>
              </div>
            </div>
            
            {/* Buy/Sell Volume Progress Bar */}
            {totalVolume > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Buy: {buyPercentage.toFixed(1)}%</span>
                  <span>Sell: {sellPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300 ease-out"
                    style={{ width: `${buyPercentage}%` }}
                  />
                  <div 
                    className="h-full bg-red-500 transition-all duration-300 ease-out -mt-1"
                    style={{ width: `${sellPercentage}%`, marginLeft: `${buyPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default TokenAnalytics;
import { useState, useEffect, useRef } from "react"
import { poolsAPI } from "@/services/api"
import { useParams } from "react-router-dom"

export const TradingViewChart = ({ pool }: { pool?: string }) => {
  const { chain, tokenAddress } = useParams<{ chain: string; tokenAddress: string }>()
  const containerRef = useRef<HTMLDivElement>(null);
  const [pairAddress, setPairAddress] = useState<string | null>(null);

  useEffect(() => {
    if (pool) {
      setPairAddress(pool);
      return;
    }
    if (!tokenAddress) return;

    const fetchPool = async () => {
      const pool = await poolsAPI.getPoolByTokenAddress(tokenAddress);
      if (pool.success) {
        setPairAddress(pool.data.address);
      }
    }
    fetchPool();
  }, [tokenAddress, pool]);

  useEffect(() => {
    if (typeof window === 'undefined' || !pairAddress) return;

    const loadWidget = () => {
      if (typeof (window as any).createMyWidget === 'function') {
        (window as any).createMyWidget("tradingview-chart", {
          autoSize: true,
          chainId: '0x1',
          pairAddress: pairAddress,
          showHoldersChart: true,
          defaultInterval: '1D',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Etc/UTC',
          theme: 'moralis',
          locale: 'en',
          hideLeftToolbar: false,
          hideTopToolbar: false,
          hideBottomToolbar: false
        });
      } else {
        console.error('createMyWidget function is not defined.');
      }
    };

    if (!document.getElementById('moralis-chart-widget')) {
      const script = document.createElement('script');
      script.id = 'moralis-chart-widget';
      script.src = 'https://moralis.com/static/embed/chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = loadWidget;
      script.onerror = () => {
        console.error('Failed to load the chart widget script.');
      };
      document.body.appendChild(script);
    } else {
      loadWidget();
    }
  }, [pairAddress]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <iframe
        src={`https://www.gmgn.cc/kline/eth/${tokenAddress}`}
        width="100%"
        height="100%"
      />
      {/* <div
        id={"tradingview-chart"}
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      /> */}
    </div>
  );
}
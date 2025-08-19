import { useEffect, useRef } from "react";
import { CandlestickSeries, createChart } from "lightweight-charts";

const CandlestickChart = ({ candlestickData }: { candlestickData: any }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current) {
        const chart = createChart(chartContainerRef.current!, {
        width: chartContainerRef.current!.offsetWidth || 800,
        height: 400,
        layout: {
          background: { color: "#000000" },
          textColor: "#333",
        },
        grid: {
          vertLines: { color: "#f0f3fa" },
          horzLines: { color: "#f0f3fa" },
        },
        timeScale: {
          timeVisible: true,
          borderVisible: true,
        },
      });

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#4caf50",
        downColor: "#f44336",
        borderVisible: false,
        wickUpColor: "#4caf50",
        wickDownColor: "#f44336",
      });

      chartRef.current = { chart, candlestickSeries };
    }

    if (candlestickData.length > 0) {
      chartRef.current.candlestickSeries.setData(candlestickData);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.chart.remove();
        chartRef.current = null;
      }
    };
  }, [candlestickData]);

  return (
    <div
      ref={chartContainerRef}
      style={{ position: "relative", height: "400px" }}
    />
  );
};

export default CandlestickChart;
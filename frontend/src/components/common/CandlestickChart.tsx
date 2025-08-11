import { useEffect, useRef } from "react";
import { CandlestickSeries, ColorType, createChart, LineStyle } from "lightweight-charts";

const CandlestickChart = ({ candlestickData }: { candlestickData: any }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<{ chart: any; candlestickSeries: any } | null>(null);

  useEffect(() => {
    if (!chartRef.current) {
      if (!chartContainerRef.current) return;

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.offsetWidth || 800,
        height: 400,
        layout: {
          background: { type: ColorType.Solid, color: "#ffffff" },
          textColor: "#333",
        },
        grid: {
          vertLines: { color: "#f0f3fa", style: LineStyle.Solid },
          horzLines: { color: "#f0f3fa", style: LineStyle.Solid },
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
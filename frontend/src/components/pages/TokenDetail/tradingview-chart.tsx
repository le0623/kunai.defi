export const TradingViewChart = ({ pool }: { pool?: string }) => {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <iframe
        src={`https://www.gmgn.cc/kline/eth/${pool}`}
        width="100%"
        height="100%"
      />
    </div>
  );
}
export function Footer({ blocksNum, usageDays }) {
  return (
    <div className="footer">
      <div className="via">
        <span>Via Roam Research</span>
      </div>

      <div className="stat">
        <span>{blocksNum || 0} BLOCKS · </span>
        <span>{usageDays || 0} DAYS</span>
      </div>
    </div>
  );
}

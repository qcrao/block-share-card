export function Footer({ blocksNum, usageDays, block }) {
  return (
    <>
      <div className="footer">
        <div className="via">
          <span>Via Roam Research</span>
        </div>

        <div className="stat">
          <span>{blocksNum} BLOCKS · </span>
          <span>{usageDays} DAYS</span>
        </div>
      </div>
      <img src="" className="share-card" />
    </>
  );
}

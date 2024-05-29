export function Footer({ blocksNum, usageDays, block }) {
  return (
    <>
      <div className="footer-via">
        <span>Via Roam Research</span>
      </div>
      <div className="footer">
        <div className="stat">
          <span>{blocksNum} BLOCKS · </span>
          <span>{usageDays} DAYS</span>
        </div>
        <div className="author">
          <span className="at">𐃏</span>
          <span className="username">码农桃花源</span>
        </div>
      </div>
      <img src="" className="share-card" />
    </>
  );
}

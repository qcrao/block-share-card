
export function Footer({ blocksNum, usageDays, block }) {
  return (
    <>
      <div className="footer">
        <div className="stat">
          <span>{blocksNum} BLOCKS · </span>
          <span>{usageDays} DAYS</span>
        </div>
        <div className="author">
          <span className="at">𐃏</span>
          <span className="username">
            <a href="https://qcrao.com">QCRAO.COM</a>
          </span>
        </div>
      </div>
      <img src="" className="share-card" />
    </>
  );
}

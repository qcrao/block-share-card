export function Header({ block }) {
  return (
    <div className="memo">
      <div className="author">
        <span className="at">𐃏</span>
        <span className="username">码农桃花源</span>
      </div>

      <div className="time">
        {new Date(block.time).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </div>

      <div className="content">
        <p>{block.string}</p>
        <p />
        <p>
          <span className="tag">{"#" + block.tags.join("# ")}</span>
        </p>
      </div>
    </div>
  );
}

export function Header({ block, extensionAPI }) {
  let showTime = block.createTime;
  const ifShowEditTime = extensionAPI.settings.get("create-edit-time");
  if (ifShowEditTime === "Edit Time") {
    showTime = block.editTime;
  }

  return (
    <div className="memo">
      <div className="author">
        <span className="at">@</span>
        <span className="username">{block.username}</span>
      </div>

      <div className="time">
        {new Date(showTime).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";

export function Header({ block, extensionAPI }) {
  const [showTime, setShowTime] = useState(block.createTime || Date.now());

  useEffect(() => {
    // Handle async settings.get properly
    const loadSettings = async () => {
      try {
        const ifShowEditTime = await extensionAPI.settings.get("create-edit-time");
        if (ifShowEditTime === "Edit Time" && block.editTime) {
          setShowTime(block.editTime);
        }
      } catch (error) {
        console.error("Failed to load time display setting:", error);
      }
    };
    loadSettings();
  }, [block.editTime, extensionAPI]);

  const username = block.username || "Unknown";

  // Format time safely
  const formatTime = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) {
      return "Unknown time";
    }
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="memo">
      <div className="author">
        <span className="at">@</span>
        <span className="username">{username}</span>
      </div>

      <div className="time">{formatTime(showTime)}</div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { extractBlockContent } from "./ModernCard";

/**
 * Render content segments with Classic theme styling
 */
function renderSegments(segments) {
  return segments.map((seg, index) => {
    switch (seg.type) {
      case "pageRef":
        return (
          <span key={index} className="classic-page-ref">
            [[{seg.value}]]
          </span>
        );
      case "tag":
        return (
          <span key={index} className="classic-tag">
            {seg.value}
          </span>
        );
      case "bold":
        return <strong key={index}>{seg.value}</strong>;
      case "italic":
        return <em key={index}>{seg.value}</em>;
      case "highlight":
        return (
          <mark key={index} className="classic-highlight">
            {seg.value}
          </mark>
        );
      case "strikethrough":
        return <del key={index}>{seg.value}</del>;
      case "code":
        return (
          <code key={index} className="classic-code">
            {seg.value}
          </code>
        );
      case "link":
        return (
          <span key={index} className="classic-link">
            {seg.value}
          </span>
        );
      case "image":
        return (
          <div key={index} className="classic-image-container">
            <img src={seg.value} alt="" className="classic-image" />
          </div>
        );
      case "text":
      default:
        return <span key={index}>{seg.value}</span>;
    }
  });
}

/**
 * Classic Card Header
 */
function ClassicHeader({ username, time }) {
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
    <div className="classic-card-header">
      <div className="classic-memo">
        <div className="classic-author">
          <span className="classic-at">@</span>
          <span className="classic-username">{username || "Unknown"}</span>
        </div>
        <div className="classic-time">{formatTime(time)}</div>
      </div>
      <div className="classic-double-line" />
    </div>
  );
}

/**
 * Classic Card Content - renders blocks as bullet list items
 */
function ClassicContent({ segments }) {
  if (!segments || segments.length === 0) {
    return <div className="classic-card-content" />;
  }

  return (
    <div className="classic-card-content">
      {segments.map((block, blockIndex) => (
        <div key={blockIndex} className="classic-block">
          <div className="classic-bullet">
            <span className="classic-bullet-dot" />
          </div>
          <div className="classic-block-text">
            {renderSegments(block.content)}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Classic Card Footer
 */
function ClassicFooter({ blocksNum, usageDays, showStats }) {
  return (
    <div className="classic-card-footer">
      <div className="classic-via">
        <span>Via Roam Research</span>
      </div>
      {showStats && (
        <div className="classic-stat">
          <span>{blocksNum || 0} BLOCKS · </span>
          <span>{usageDays || 0} DAYS</span>
        </div>
      )}
    </div>
  );
}

/**
 * Main Classic Card Component
 */
export function ClassicCard({
  block,
  content,
  blocksNum,
  usageDays,
  showStats = true,
  extensionAPI,
  cardStyle = "Default",
}) {
  const [showTime, setShowTime] = useState(block?.createTime || Date.now());

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const ifShowEditTime = await extensionAPI?.settings.get("create-edit-time");
        if (ifShowEditTime === "Edit Time" && block?.editTime) {
          setShowTime(block.editTime);
        }
      } catch (error) {
        console.error("Failed to load time display setting:", error);
      }
    };
    if (extensionAPI) {
      loadSettings();
    }
  }, [block?.editTime, extensionAPI]);

  const isDefaultStyle = cardStyle === "Default";

  return (
    <div className={`classic-card ${isDefaultStyle ? "classic-card-default" : "classic-card-vanilla"}`}>
      <ClassicHeader username={block?.username} time={showTime} />
      <ClassicContent segments={content?.segments || []} />
      <ClassicFooter
        blocksNum={blocksNum}
        usageDays={usageDays}
        showStats={showStats}
      />
    </div>
  );
}

export { extractBlockContent };

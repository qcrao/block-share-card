import { useState, useEffect } from "react";

/**
 * Extract rich content from a block element, preserving structure
 * Returns an array of content segments with type info
 */
function extractBlockContent(blockContainer) {
  if (!blockContainer) return { segments: [], images: [] };

  const segments = [];
  const images = [];

  // Get all block text elements (including nested children)
  const allBlockTexts = blockContainer.querySelectorAll(".rm-block-text");

  allBlockTexts.forEach((blockText, index) => {
    const result = extractContentFromElement(blockText);
    if (result.segments.length > 0) {
      segments.push({
        type: index === 0 ? "main" : "child",
        content: result.segments
      });
    }
    images.push(...result.images);
  });

  return { segments, images };
}

/**
 * Extract content from an element, preserving rich formatting
 * Filters out plugin elements like copy buttons
 */
function extractContentFromElement(element) {
  if (!element) return { segments: [], images: [] };

  const segments = [];
  const images = [];

  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true);

  // Remove plugin elements (copy buttons, tooltips, etc.)
  const pluginSelectors = [
    ".bp3-popover-wrapper",      // Blueprint popovers (copy buttons etc.)
    ".bp3-popover-target",
    ".bp3-tooltip-indicator",
    "[class*='copy']",           // Any copy-related elements
    "button",                     // Buttons
    ".roam-toolkit-copy-icon",   // Toolkit copy icons
    ".rm-block-ref__copy",       // Block ref copy
    "[data-tooltip]",            // Tooltip elements
    ".rm-caret",                 // Expand/collapse carets
    ".rm-bullet",                // Bullets
    ".rm-multibar",              // Multi-select bars
    "svg",                       // SVG icons
    ".bp3-icon",                 // Blueprint icons
    ".rm-block-ref__delete",     // Delete buttons
  ];

  pluginSelectors.forEach(selector => {
    try {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    } catch (e) {
      // Ignore invalid selectors
    }
  });

  // Process child nodes
  processNode(clone, segments, images);

  return { segments, images };
}

/**
 * Recursively process DOM nodes to extract content
 */
function processNode(node, segments, images) {
  if (!node) return;

  node.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent;
      // Keep text as-is (including spaces) but skip if completely empty
      if (text && text.length > 0) {
        // Only add if not just whitespace, or if it's meaningful space between elements
        if (text.trim() || (segments.length > 0 && text.includes(' '))) {
          segments.push({ type: "text", value: text });
        }
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tagName = child.tagName.toLowerCase();
      const className = child.className || "";
      const classStr = typeof className === "string" ? className : "";

      // Skip hidden elements
      if (child.style?.display === "none" || child.hidden) {
        return;
      }

      // Skip SVG and icon elements
      if (tagName === "svg" || classStr.includes("bp3-icon")) {
        return;
      }

      // Handle images
      if (tagName === "img") {
        const src = child.src;
        if (src && !src.includes("data:image/svg")) {
          images.push(src);
          segments.push({ type: "image", value: src });
        }
        return;
      }

      // Handle page references [[page]] - check for the wrapper span
      if (classStr.includes("rm-page-ref--link") || classStr.includes("rm-page-ref--tag")) {
        const text = child.textContent;
        if (text) {
          segments.push({ type: "pageRef", value: text });
        }
        return;
      }

      // Handle page reference brackets (skip them)
      if (classStr.includes("rm-page-ref__brackets")) {
        return;
      }

      // Handle tags #tag
      if (classStr.includes("rm-tag")) {
        const text = child.textContent;
        if (text) {
          segments.push({ type: "tag", value: text });
        }
        return;
      }

      // Handle bold
      if (classStr.includes("rm-bold") || tagName === "strong" || tagName === "b") {
        const text = child.textContent;
        if (text) {
          segments.push({ type: "bold", value: text });
        }
        return;
      }

      // Handle italics
      if (classStr.includes("rm-italics") || tagName === "em" || tagName === "i") {
        const text = child.textContent;
        if (text) {
          segments.push({ type: "italic", value: text });
        }
        return;
      }

      // Handle highlights
      if (classStr.includes("rm-highlight")) {
        const text = child.textContent;
        if (text) {
          segments.push({ type: "highlight", value: text });
        }
        return;
      }

      // Handle strikethrough ~~text~~
      if (tagName === "del" || tagName === "s" || tagName === "strike" || classStr.includes("rm-strikethrough")) {
        const text = child.textContent;
        if (text) {
          segments.push({ type: "strikethrough", value: text });
        }
        return;
      }

      // Handle code
      if (tagName === "code" || classStr.includes("rm-code")) {
        const text = child.textContent;
        if (text) {
          segments.push({ type: "code", value: text });
        }
        return;
      }

      // Handle links
      if (tagName === "a" && !classStr.includes("rm-page-ref")) {
        const text = child.textContent;
        const href = child.href;
        if (text) {
          segments.push({ type: "link", value: text, href });
        }
        return;
      }

      // Recursively process other elements
      processNode(child, segments, images);
    }
  });
}

/**
 * Render content segments with proper styling
 */
function renderSegments(segments, theme) {
  return segments.map((seg, index) => {
    switch (seg.type) {
      case "pageRef":
        return (
          <span key={index} className={`modern-page-ref modern-page-ref-${theme}`}>
            {seg.value}
          </span>
        );
      case "tag":
        return (
          <span key={index} className={`modern-tag modern-tag-${theme}`}>
            {seg.value}
          </span>
        );
      case "bold":
        return <strong key={index}>{seg.value}</strong>;
      case "italic":
        return <em key={index}>{seg.value}</em>;
      case "highlight":
        return (
          <mark key={index} className={`modern-highlight modern-highlight-${theme}`}>
            {seg.value}
          </mark>
        );
      case "strikethrough":
        return (
          <del key={index} className={`modern-strikethrough modern-strikethrough-${theme}`}>
            {seg.value}
          </del>
        );
      case "code":
        return (
          <code key={index} className={`modern-code modern-code-${theme}`}>
            {seg.value}
          </code>
        );
      case "link":
        return (
          <span key={index} className={`modern-link modern-link-${theme}`}>
            {seg.value}
          </span>
        );
      case "image":
        return (
          <div key={index} className="modern-image-container">
            <img src={seg.value} alt="" className="modern-image" />
          </div>
        );
      case "text":
      default:
        return <span key={index}>{seg.value}</span>;
    }
  });
}

/**
 * Modern Card Header with gradient accent
 */
function ModernHeader({ username, time, theme }) {
  const formatTime = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="modern-card-header">
      <div className="modern-header-accent" />
      <div className="modern-header-content">
        <div className="modern-author">
          <div className="modern-avatar">{username ? username.charAt(0).toUpperCase() : "?"}</div>
          <span className="modern-username">{username || "Anonymous"}</span>
        </div>
        {time && <div className="modern-time">{formatTime(time)}</div>}
      </div>
    </div>
  );
}

/**
 * Modern Card Content - renders as paragraphs (article style)
 */
function ModernContent({ segments, images, theme }) {
  if (!segments || segments.length === 0) {
    return <div className="modern-card-content" />;
  }

  return (
    <div className="modern-card-content">
      {segments.map((block, blockIndex) => (
        <p key={blockIndex} className="modern-paragraph">
          {renderSegments(block.content, theme)}
        </p>
      ))}
    </div>
  );
}

/**
 * Modern Card Footer
 */
function ModernFooter({ blocksNum, usageDays, showStats, theme }) {
  return (
    <div className="modern-card-footer">
      <div className="modern-footer-brand">
        <div className={`modern-logo-wrapper modern-logo-wrapper-${theme}`}>
          <img
            src="https://roamresearch.com/assets/astrolabe-white.png"
            alt="Roam"
            className="modern-logo"
          />
        </div>
        <span>Roam Research</span>
      </div>
      {showStats && (
        <div className="modern-footer-stats">
          <span>{blocksNum || 0} blocks</span>
          <span className="modern-stat-divider">·</span>
          <span>{usageDays || 0} days</span>
        </div>
      )}
    </div>
  );
}

/**
 * Main Modern Card Component
 */
export function ModernCard({
  block,
  content,
  blocksNum,
  usageDays,
  showStats = true,
  extensionAPI,
  theme = "light"
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

  return (
    <div className={`modern-card modern-card-${theme}`}>
      <ModernHeader
        username={block?.username}
        time={showTime}
        theme={theme}
      />
      <ModernContent
        segments={content?.segments || []}
        images={content?.images || []}
        theme={theme}
      />
      <ModernFooter
        blocksNum={blocksNum}
        usageDays={usageDays}
        showStats={showStats}
        theme={theme}
      />
    </div>
  );
}

export { extractBlockContent };

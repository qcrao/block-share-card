import { useState, useEffect } from "react";

/**
 * Get block UID from a block element
 */
function getBlockUid(element) {
  if (!element) return null;

  // Try to get from the block's id attribute (format: block-input-xxx-uid)
  const blockInput = element.closest(".rm-block__input");
  if (blockInput?.id) {
    const match = blockInput.id.match(/block-input-[^-]+-(.+)/);
    if (match) return match[1];
  }

  // Try from rm-block-text id
  const blockText = element.closest(".rm-block-text");
  if (blockText?.id) {
    // ID format ends with the 9-char UID
    return blockText.id.slice(-9);
  }

  // Try from data-block-uid attribute
  const blockMain = element.closest("[data-block-uid]");
  if (blockMain) {
    return blockMain.getAttribute("data-block-uid");
  }

  return null;
}

/**
 * Get block data from Roam API including children
 */
function getBlockWithChildren(uid) {
  if (!uid || typeof roamAlphaAPI === "undefined") return null;

  try {
    const result = roamAlphaAPI.q(`
      [:find (pull ?b [:block/string :block/uid :block/order :block/open
                       {:block/children [:block/string :block/uid :block/order :block/open
                         {:block/children [:block/string :block/uid :block/order :block/open
                           {:block/children [:block/string :block/uid :block/order]}]}]}])
       :where [?b :block/uid "${uid}"]]
    `);

    if (result && result[0] && result[0][0]) {
      return result[0][0];
    }
  } catch (e) {
    console.error("Failed to query block data:", e);
  }

  return null;
}

/**
 * Parse Markdown text to segments
 */
function parseMarkdownText(text) {
  if (!text) return [];

  const segments = [];

  // Regex patterns for different Markdown elements
  const patterns = [
    // Code blocks (triple backticks) - must be first
    { regex: /```(\w*)\n?([\s\S]*?)```/g, type: "codeBlock", extract: (m) => ({ value: m[2], language: m[1] || "" }) },
    // Inline code
    { regex: /`([^`]+)`/g, type: "code", extract: (m) => ({ value: m[1] }) },
    // Bold **text** or __text__
    { regex: /\*\*([^*]+)\*\*|__([^_]+)__/g, type: "bold", extract: (m) => ({ value: m[1] || m[2] }) },
    // Italic *text* or _text_
    { regex: /(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/g, type: "italic", extract: (m) => ({ value: m[1] || m[2] }) },
    // Strikethrough ~~text~~
    { regex: /~~([^~]+)~~/g, type: "strikethrough", extract: (m) => ({ value: m[1] }) },
    // Highlight ^^text^^
    { regex: /\^\^([^^]+)\^\^/g, type: "highlight", extract: (m) => ({ value: m[1] }) },
    // Page references [[page]]
    { regex: /\[\[([^\]]+)\]\]/g, type: "pageRef", extract: (m) => ({ value: m[1] }) },
    // Tags #tag or #[[tag]]
    { regex: /#(\[\[([^\]]+)\]\]|\w+)/g, type: "tag", extract: (m) => ({ value: "#" + (m[2] || m[1]) }) },
    // Block references ((uid))
    { regex: /\(\(([a-zA-Z0-9_-]{9})\)\)/g, type: "blockRef", extract: (m) => ({ value: m[1] }) },
    // Links [text](url)
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: "link", extract: (m) => ({ value: m[1], href: m[2] }) },
    // Images ![alt](url)
    { regex: /!\[([^\]]*)\]\(([^)]+)\)/g, type: "image", extract: (m) => ({ value: m[2], alt: m[1] }) },
    // Blockquote > text (at line start)
    { regex: /^>\s*(.+)$/gm, type: "blockquote", extract: (m) => ({ value: m[1] }) },
  ];

  // Find all matches with their positions
  const allMatches = [];
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: pattern.type,
        ...pattern.extract(match),
        raw: match[0]
      });
    }
  }

  // Sort by position
  allMatches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (keep the first one)
  const filteredMatches = [];
  let lastEnd = 0;
  for (const match of allMatches) {
    if (match.start >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.end;
    }
  }

  // Build segments
  let pos = 0;
  for (const match of filteredMatches) {
    // Add text before this match
    if (match.start > pos) {
      const textBefore = text.slice(pos, match.start);
      if (textBefore) {
        segments.push({ type: "text", value: textBefore });
      }
    }

    // Add the matched segment
    segments.push({
      type: match.type,
      value: match.value,
      ...(match.href && { href: match.href }),
      ...(match.language && { language: match.language }),
      ...(match.alt && { alt: match.alt }),
    });

    pos = match.end;
  }

  // Add remaining text
  if (pos < text.length) {
    segments.push({ type: "text", value: text.slice(pos) });
  }

  // If no matches found, return the whole text as one segment
  if (segments.length === 0 && text) {
    segments.push({ type: "text", value: text });
  }

  return segments;
}

/**
 * Process a block and its children recursively, extracting content from API data
 */
function processBlockFromApi(block, depth = 0) {
  const result = [];

  if (!block) return result;

  const text = block[":block/string"] || "";
  const children = block[":block/children"] || [];

  // Check if this is a code block (starts with ```)
  const isCodeBlock = text.startsWith("```");

  if (text) {
    if (isCodeBlock) {
      // Parse code block
      const match = text.match(/```(\w*)\n?([\s\S]*?)(?:```)?$/);
      const language = match ? match[1] : "";
      const code = match ? match[2] : text.slice(3);
      result.push({
        type: depth === 0 ? "main" : "child",
        depth,
        content: [{ type: "codeBlock", value: code.trim(), language }]
      });
    } else {
      result.push({
        type: depth === 0 ? "main" : "child",
        depth,
        content: parseMarkdownText(text)
      });
    }
  }

  // Process children regardless of open state (this is the key fix!)
  if (children.length > 0) {
    // Sort children by order
    const sortedChildren = [...children].sort((a, b) =>
      (a[":block/order"] || 0) - (b[":block/order"] || 0)
    );

    for (const child of sortedChildren) {
      result.push(...processBlockFromApi(child, depth + 1));
    }
  }

  return result;
}

/**
 * Extract rich content from a block element, preserving structure
 * Returns an array of content segments with type info
 * Now uses Roam API to get collapsed children content
 */
function extractBlockContent(blockContainer) {
  if (!blockContainer) return { segments: [], images: [] };

  const segments = [];
  const images = [];

  // Try to get the root block UID
  const firstBlockText = blockContainer.querySelector(".rm-block-text");
  const rootUid = getBlockUid(firstBlockText);

  if (rootUid) {
    // Use Roam API to get all content including collapsed children
    const blockData = getBlockWithChildren(rootUid);

    if (blockData) {
      const apiSegments = processBlockFromApi(blockData);

      // Extract images from segments
      for (const seg of apiSegments) {
        for (const item of seg.content) {
          if (item.type === "image") {
            images.push(item.value);
          }
        }
      }

      return { segments: apiSegments, images };
    }
  }

  // Fallback: Get all block text elements from DOM (including nested children)
  const allBlockTexts = blockContainer.querySelectorAll(".rm-block-text");

  allBlockTexts.forEach((blockText, index) => {
    const result = extractContentFromElement(blockText);
    if (result.segments.length > 0) {
      segments.push({
        type: index === 0 ? "main" : "child",
        depth: 0, // DOM fallback doesn't track depth
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
 * Get resolved text for a block reference
 */
function getBlockRefText(uid) {
  if (!uid || typeof roamAlphaAPI === "undefined") return `((${uid}))`;

  try {
    const result = roamAlphaAPI.q(`
      [:find ?s . :where [?b :block/uid "${uid}"] [?b :block/string ?s]]
    `);
    if (result) {
      // Return a simplified version (strip markdown)
      return result.replace(/\*\*|__|\*|_|~~|\^\^|`/g, "").slice(0, 50) + (result.length > 50 ? "..." : "");
    }
  } catch (e) {
    console.error("Failed to resolve block ref:", e);
  }

  return `((${uid}))`;
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
      case "codeBlock":
        return (
          <pre key={index} className={`modern-code-block modern-code-block-${theme}`}>
            {seg.language && (
              <span className="modern-code-language">{seg.language}</span>
            )}
            <code>{seg.value}</code>
          </pre>
        );
      case "blockquote":
        return (
          <blockquote key={index} className={`modern-blockquote modern-blockquote-${theme}`}>
            {seg.value}
          </blockquote>
        );
      case "blockRef":
        return (
          <span key={index} className={`modern-block-ref modern-block-ref-${theme}`}>
            {getBlockRefText(seg.value)}
          </span>
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
            <img src={seg.value} alt={seg.alt || ""} className="modern-image" />
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
 * Modern Card Content - renders as paragraphs with indentation for nested blocks
 */
function ModernContent({ segments, theme }) {
  if (!segments || segments.length === 0) {
    return <div className="modern-card-content" />;
  }

  return (
    <div className="modern-card-content">
      {segments.map((block, blockIndex) => {
        const depth = block.depth || 0;
        const isCodeBlock = block.content.length === 1 && block.content[0].type === "codeBlock";

        // For code blocks, render without paragraph wrapper
        if (isCodeBlock) {
          return (
            <div
              key={blockIndex}
              className={`modern-block modern-block-depth-${Math.min(depth, 4)}`}
              style={{ marginLeft: depth > 0 ? `${depth * 16}px` : 0 }}
            >
              {renderSegments(block.content, theme)}
            </div>
          );
        }

        return (
          <div
            key={blockIndex}
            className={`modern-block modern-block-depth-${Math.min(depth, 4)}`}
            style={{ marginLeft: depth > 0 ? `${depth * 16}px` : 0 }}
          >
            {depth > 0 && <span className="modern-bullet">•</span>}
            <p className="modern-paragraph">
              {renderSegments(block.content, theme)}
            </p>
          </div>
        );
      })}
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

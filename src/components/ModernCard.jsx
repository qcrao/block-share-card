import { useState, useEffect } from "react";
import Prism from "prismjs";
// Import common language support
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-shell-session";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-clojure";

/**
 * Highlight code using Prism.js
 * Returns HTML string with syntax highlighting
 */
function highlightCode(code, language) {
  if (!code) return "";

  // Map common language aliases
  const languageMap = {
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "rb": "ruby",
    "sh": "bash",
    "shell": "bash",
    "yml": "yaml",
    "cs": "csharp",
    "c++": "cpp",
    "clj": "clojure",
  };

  const normalizedLang = languageMap[language?.toLowerCase()] || language?.toLowerCase() || "plaintext";

  // Check if language is supported
  const grammar = Prism.languages[normalizedLang];
  if (grammar) {
    try {
      return Prism.highlight(code, grammar, normalizedLang);
    } catch (e) {
      console.warn("Prism highlight failed:", e);
    }
  }

  // Fallback: escape HTML and return as-is
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Get block UID from a block element
 * Roam block UIDs are 9 characters, e.g., "LAk4T_1oa"
 */
function getBlockUid(element) {
  if (!element) return null;

  // Try from data-block-uid attribute first (most reliable)
  const blockMain = element.closest("[data-block-uid]");
  if (blockMain) {
    const uid = blockMain.getAttribute("data-block-uid");
    console.log("[ShareCard] getBlockUid from data-block-uid:", uid);
    return uid;
  }

  // Try to get from the block's id attribute
  // Format: block-input-{graphId}-body-outline-{uid} or block-input-{graphId}-{uid}
  const blockInput = element.closest(".rm-block__input");
  if (blockInput?.id) {
    console.log("[ShareCard] getBlockUid blockInput.id:", blockInput.id);
    // The UID is the last 9 characters
    const uid = blockInput.id.slice(-9);
    // Verify it looks like a valid UID (alphanumeric with _ and -)
    if (/^[a-zA-Z0-9_-]{9}$/.test(uid)) {
      console.log("[ShareCard] getBlockUid extracted UID:", uid);
      return uid;
    }
  }

  // Try from rm-block-text id
  const blockText = element.closest(".rm-block-text");
  if (blockText?.id) {
    console.log("[ShareCard] getBlockUid blockText.id:", blockText.id);
    // ID format ends with the 9-char UID
    const uid = blockText.id.slice(-9);
    if (/^[a-zA-Z0-9_-]{9}$/.test(uid)) {
      console.log("[ShareCard] getBlockUid extracted UID from blockText:", uid);
      return uid;
    }
  }

  console.log("[ShareCard] getBlockUid: no UID found");
  return null;
}

/**
 * Get block data from Roam API including children (recursive)
 */
function getBlockWithChildren(uid) {
  if (!uid || typeof roamAlphaAPI === "undefined") return null;

  try {
    // Use q query which is more reliable
    const result = roamAlphaAPI.q(`
      [:find (pull ?b [:block/string :block/uid :block/order :block/open
                       {:block/children [:block/string :block/uid :block/order :block/open
                         {:block/children [:block/string :block/uid :block/order :block/open
                           {:block/children [:block/string :block/uid :block/order :block/open
                             {:block/children [:block/string :block/uid :block/order :block/open
                               {:block/children [:block/string :block/uid :block/order]}]}]}]}]}])
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

  if (!block) {
    console.log("[ShareCard] processBlockFromApi: block is null");
    return result;
  }

  // Handle both Clojure-style keys (:block/string) and JS-style keys (string)
  const text = block[":block/string"] || block["string"] || "";
  const children = block[":block/children"] || block["children"] || [];

  console.log("[ShareCard] processBlockFromApi depth:", depth, "text:", text.substring(0, 100), "children:", children.length);

  // Check if this is a code block (starts with ```)
  const isCodeBlock = typeof text === "string" && text.startsWith("```");
  console.log("[ShareCard] isCodeBlock:", isCodeBlock);

  if (text && typeof text === "string") {
    if (isCodeBlock) {
      // Parse code block - extract language and code content
      const lines = text.split("\n");
      const firstLine = lines[0] || "";
      // Extract language from first line (```go, ```javascript, etc.)
      const langMatch = firstLine.match(/^```(\w*)/);
      const language = langMatch ? langMatch[1] : "";

      console.log("[ShareCard] Code block detected, language:", language, "lines count:", lines.length);

      // Get code content (everything after first line, excluding trailing ```)
      let codeLines = lines.slice(1);
      // Remove trailing ``` line if present (check multiple formats)
      while (codeLines.length > 0) {
        const lastLine = codeLines[codeLines.length - 1];
        if (lastLine.trim() === "```" || lastLine.trim() === "") {
          codeLines = codeLines.slice(0, -1);
        } else if (lastLine.endsWith("```")) {
          // Handle case where ``` is at the end of the last code line
          codeLines[codeLines.length - 1] = lastLine.slice(0, -3);
          break;
        } else {
          break;
        }
      }
      const code = codeLines.join("\n");

      console.log("[ShareCard] Extracted code:", code.substring(0, 200));

      result.push({
        type: depth === 0 ? "main" : "child",
        depth,
        content: [{ type: "codeBlock", value: code, language }]
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
 *
 * Strategy: Always use Roam API as the primary source for content extraction.
 * This ensures we get the raw markdown text which is much easier to parse correctly,
 * especially for code blocks which have complex DOM structures in CodeMirror.
 */
function extractBlockContent(blockContainer) {
  console.log("[ShareCard] extractBlockContent called", blockContainer);

  if (!blockContainer) {
    console.log("[ShareCard] blockContainer is null");
    return { segments: [], images: [] };
  }

  const segments = [];
  const images = [];

  // Try to get the root block UID
  const firstBlockText = blockContainer.querySelector(".rm-block-text");
  console.log("[ShareCard] firstBlockText:", firstBlockText);

  const rootUid = getBlockUid(firstBlockText) || getBlockUid(blockContainer);
  console.log("[ShareCard] rootUid:", rootUid);

  if (rootUid && typeof roamAlphaAPI !== "undefined") {
    // Use Roam API to get block data (most reliable method)
    console.log("[ShareCard] Calling getBlockWithChildren...");
    const blockData = getBlockWithChildren(rootUid);
    console.log("[ShareCard] blockData:", JSON.stringify(blockData, null, 2));

    if (blockData) {
      const apiSegments = processBlockFromApi(blockData);
      console.log("[ShareCard] apiSegments:", JSON.stringify(apiSegments, null, 2));

      // Extract images from segments
      for (const seg of apiSegments) {
        for (const item of seg.content) {
          if (item.type === "image") {
            images.push(item.value);
          }
        }
      }

      if (apiSegments.length > 0) {
        console.log("[ShareCard] Returning API segments, count:", apiSegments.length);
        return { segments: apiSegments, images };
      }
    }
  } else {
    console.log("[ShareCard] API not available or no rootUid. roamAlphaAPI defined:", typeof roamAlphaAPI !== "undefined");
  }

  // Fallback: Extract from DOM if API fails
  console.log("[ShareCard] Falling back to DOM extraction");
  const allBlockTexts = blockContainer.querySelectorAll(".rm-block-text");
  console.log("[ShareCard] Found block texts:", allBlockTexts.length);

  allBlockTexts.forEach((blockText, index) => {
    const result = extractContentFromElement(blockText);
    if (result.segments.length > 0) {
      segments.push({
        type: index === 0 ? "main" : "child",
        depth: 0,
        content: result.segments
      });
    }
    images.push(...result.images);
  });

  console.log("[ShareCard] Final segments:", JSON.stringify(segments, null, 2));
  return { segments, images };
}

/**
 * Extract content from an element, preserving rich formatting
 * This is a fallback when API extraction fails
 * Filters out plugin elements like copy buttons
 */
function extractContentFromElement(element) {
  if (!element) return { segments: [], images: [] };

  const segments = [];
  const images = [];

  // Skip code blocks entirely - they should be handled by API
  const classStr = typeof element.className === "string" ? element.className : "";
  if (classStr.includes("rm-code-block") || classStr.includes("CodeMirror")) {
    return { segments, images };
  }

  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true);

  // Remove plugin elements and code blocks (copy buttons, tooltips, etc.)
  const removeSelectors = [
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
    ".rm-code-block",            // Code blocks (handled by API)
    ".CodeMirror",               // CodeMirror editors
  ];

  removeSelectors.forEach(selector => {
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
 * This is a fallback for when API extraction fails
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

      // Skip SVG, icon elements, and code blocks
      if (tagName === "svg" || classStr.includes("bp3-icon")) {
        return;
      }

      // Skip code blocks entirely - they should be handled by API
      if (classStr.includes("rm-code-block") || classStr.includes("CodeMirror")) {
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

      // Handle inline code (not code blocks)
      if ((tagName === "code" || classStr.includes("rm-code")) && !classStr.includes("rm-code-block")) {
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
 * Get full content for a block reference (without children)
 * Returns the raw text and parsed segments
 */
function getBlockRefContent(uid) {
  if (!uid || typeof roamAlphaAPI === "undefined") {
    return { text: `((${uid}))`, segments: null };
  }

  try {
    const result = roamAlphaAPI.q(`
      [:find ?s . :where [?b :block/uid "${uid}"] [?b :block/string ?s]]
    `);
    if (result && typeof result === "string") {
      // Parse the content to get segments
      const segments = parseMarkdownText(result);
      return { text: result, segments };
    }
  } catch (e) {
    console.error("Failed to resolve block ref:", e);
  }

  return { text: `((${uid}))`, segments: null };
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
      case "codeBlock": {
        const highlightedHtml = highlightCode(seg.value, seg.language);
        return (
          <pre key={index} className={`modern-code-block modern-code-block-${theme}`}>
            {seg.language && (
              <span className="modern-code-language">{seg.language}</span>
            )}
            <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
          </pre>
        );
      }
      case "blockquote":
        return (
          <blockquote key={index} className={`modern-blockquote modern-blockquote-${theme}`}>
            {seg.value}
          </blockquote>
        );
      case "blockRef": {
        const refContent = getBlockRefContent(seg.value);
        // If we have parsed segments, render them with proper styling
        if (refContent.segments && refContent.segments.length > 0) {
          return (
            <div key={index} className={`modern-block-ref-container modern-block-ref-container-${theme}`}>
              {renderSegments(refContent.segments, theme)}
            </div>
          );
        }
        // Fallback to plain text
        return (
          <span key={index} className={`modern-block-ref modern-block-ref-${theme}`}>
            {refContent.text}
          </span>
        );
      }
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
 * Modern Card Content - renders all blocks at the same level without bullets
 */
function ModernContent({ segments, theme }) {
  if (!segments || segments.length === 0) {
    return <div className="modern-card-content" />;
  }

  return (
    <div className="modern-card-content">
      {segments.map((block, blockIndex) => {
        const isCodeBlock = block.content.length === 1 && block.content[0].type === "codeBlock";

        // For code blocks, render without paragraph wrapper
        if (isCodeBlock) {
          return (
            <div key={blockIndex} className="modern-block">
              {renderSegments(block.content, theme)}
            </div>
          );
        }

        return (
          <div key={blockIndex} className="modern-block">
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

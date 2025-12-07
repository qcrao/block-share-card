import { html } from "htm/react";
import html2canvas from "html2canvas";
import { queryCurrentActiveBlockUID } from "./api/roamSelect";
import { queryMinDate, queryNonCodeBlocks } from "./api/roamQueries";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { ModernCard, extractBlockContent } from "./components/ModernCard";
import { daysBetween } from "./utils/dateUtils";
import { downloadImage } from "./utils/imageUtils";

// Lock to prevent concurrent share operations
let isProcessing = false;

// Store React roots for proper cleanup
let headerRoot = null;
let footerRoot = null;
let modernCardRoot = null;

// Loading toast element
let loadingToast = null;

/**
 * Show loading toast with progress
 */
function showLoadingToast(message = "Generating image...") {
  hideLoadingToast();

  loadingToast = document.createElement("div");
  loadingToast.className = "share-card-loading-toast";
  loadingToast.innerHTML = `
    <div class="share-card-loading-spinner"></div>
    <span class="share-card-loading-text">${message}</span>
  `;

  document.body.appendChild(loadingToast);

  // Trigger animation
  requestAnimationFrame(() => {
    loadingToast.classList.add("show");
  });
}

/**
 * Update loading toast message
 */
function updateLoadingToast(message) {
  if (loadingToast) {
    const textEl = loadingToast.querySelector(".share-card-loading-text");
    if (textEl) {
      textEl.textContent = message;
    }
  }
}

/**
 * Hide loading toast
 */
function hideLoadingToast() {
  if (loadingToast) {
    loadingToast.classList.remove("show");
    loadingToast.classList.add("hide");
    setTimeout(() => {
      if (loadingToast && loadingToast.parentNode) {
        loadingToast.parentNode.removeChild(loadingToast);
      }
      loadingToast = null;
    }, 300);
  }
}

export function renderFooter(blocksNum, usageDays) {
  const container = document.getElementById("share-card-footer");
  if (!container) {
    console.error("Footer container not found");
    return;
  }

  // Use createRoot API (React 18+)
  if (ReactDOM.createRoot) {
    footerRoot = ReactDOM.createRoot(container);
    footerRoot.render(
      html`<${Footer} blocksNum=${blocksNum} usageDays=${usageDays} />`
    );
  } else {
    // Fallback for older React versions
    ReactDOM.render(
      html`<${Footer} blocksNum=${blocksNum} usageDays=${usageDays} />`,
      container
    );
  }
}

export function renderHeader(memo, extensionAPI) {
  const container = document.getElementById("share-card-header");
  if (!container) {
    console.error("Header container not found");
    return;
  }

  // Use createRoot API (React 18+)
  if (ReactDOM.createRoot) {
    headerRoot = ReactDOM.createRoot(container);
    headerRoot.render(
      html`<${Header} block=${memo} extensionAPI=${extensionAPI} />`
    );
  } else {
    // Fallback for older React versions
    ReactDOM.render(
      html`<${Header} block=${memo} extensionAPI=${extensionAPI} />`,
      container
    );
  }
}

export function renderModernCard(memo, content, blocksNum, usageDays, showStats, extensionAPI, theme) {
  const container = document.getElementById("modern-card-root");
  if (!container) {
    console.error("Modern card container not found");
    return;
  }

  // Use createRoot API (React 18+)
  if (ReactDOM.createRoot) {
    modernCardRoot = ReactDOM.createRoot(container);
    modernCardRoot.render(
      html`<${ModernCard}
        block=${memo}
        content=${content}
        blocksNum=${blocksNum}
        usageDays=${usageDays}
        showStats=${showStats}
        extensionAPI=${extensionAPI}
        theme=${theme}
      />`
    );
  } else {
    // Fallback for older React versions
    ReactDOM.render(
      html`<${ModernCard}
        block=${memo}
        content=${content}
        blocksNum=${blocksNum}
        usageDays=${usageDays}
        showStats=${showStats}
        extensionAPI=${extensionAPI}
        theme=${theme}
      />`,
      container
    );
  }
}

export async function shareImage(memo, isMobile, extensionAPI) {
  const node = document.querySelector(".share-memex-container");
  if (!node) {
    throw new Error("Share container not found");
  }
  const originalStyles = node.style.cssText;

  // Cache DOM queries for better performance
  const headerMemo = node.querySelector("#share-card-header .memo");
  const footerElement = node.querySelector("#share-card-footer .footer");
  const roamArticle = document.querySelector(".roam-article");

  // Fetch settings in parallel for better performance
  const [cardStyle, disableShowBlockAndDays] = await Promise.all([
    extensionAPI.settings.get("card-style"),
    extensionAPI.settings.get("disable-blocks-info-setting"),
  ]);

  // Apply layout styles based on mobile/desktop mode
  if (isMobile) {
    node.style.setProperty("width", "320px", "important");

    const authorElement = headerMemo?.querySelector(".author");
    if (authorElement) {
      authorElement.style.setProperty("width", "100%", "important");
    }
  } else {
    node.style.setProperty("width", "640px", "important");

    if (headerMemo) {
      Object.assign(headerMemo.style, {
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "initial",
      });
    }

    if (footerElement) {
      Object.assign(footerElement.style, {
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "initial",
        padding: "0 20px 10px",
      });
    }

    const timeElement = headerMemo?.querySelector(".time");
    if (timeElement) {
      timeElement.style.textAlign = "right";
    }
  }

  if (roamArticle) {
    roamArticle.style.color = "#202B33";
  }

  // Configure html2canvas options
  const options = {
    logging: false,
    scale: 3,
    useCORS: true,
    letterRendering: true,
  };

  // Apply card style
  if (cardStyle === "Default") {
    options.backgroundColor = "#FEFCF6";
    document.documentElement.style.setProperty(
      "--share-block-card-font-family-base",
      '"LXGW WenKai", -apple-system, "Microsoft YaHei", "SimSun", sans-serif'
    );
  } else {
    document.documentElement.style.setProperty(
      "--share-block-card-font-family-base",
      "inherit"
    );
  }

  // Hide stats if disabled
  if (disableShowBlockAndDays) {
    const footerStatElement = footerElement?.querySelector(".stat");
    if (footerStatElement) {
      footerStatElement.style.display = "none";
    }
  }

  const canvas = await html2canvas(node, options);
  const imageSrc = canvas.toDataURL("image/png", 1);

  downloadImage(imageSrc, memo, isMobile);

  // Reset styles and cleanup
  node.style.cssText = originalStyles;
  reset();
  return imageSrc;
}

function reset() {
  // Unmount React roots before removing elements
  if (headerRoot) {
    headerRoot.unmount();
    headerRoot = null;
  }
  if (footerRoot) {
    footerRoot.unmount();
    footerRoot = null;
  }
  if (modernCardRoot) {
    modernCardRoot.unmount();
    modernCardRoot = null;
  }

  const headerElement = document.querySelector("#share-card-header");
  if (headerElement) {
    headerElement.remove();
  }

  const footerElement = document.querySelector("#share-card-footer");
  if (footerElement) {
    footerElement.remove();
  }

  const shareContainer = document.querySelector(".share-memex-container");
  if (shareContainer) {
    shareContainer.classList.remove("share-memex-container");
  }

  const roamArticle = document.querySelector(".roam-article");
  if (roamArticle) {
    roamArticle.style.removeProperty("color");
  }

  // Clean up modern card elements
  const modernCardContainer = document.querySelector(".modern-card-wrapper");
  if (modernCardContainer) {
    modernCardContainer.remove();
  }
}

/**
 * Generate and download a modern style card image
 */
export async function shareModernCardImage(isMobile = false, theme = "light", extensionAPI) {
  // Prevent concurrent share operations
  if (isProcessing) {
    console.warn("Share operation already in progress");
    return;
  }

  isProcessing = true;
  showLoadingToast("Preparing...");

  try {
    // Parallel API queries for better performance
    let usageDays = 0;
    let blocksNum = 0;

    try {
      const [minDateResult, blocksNumResult] = await Promise.all([
        roamAlphaAPI.q(queryMinDate),
        roamAlphaAPI.q(queryNonCodeBlocks),
      ]);

      if (minDateResult) {
        usageDays = daysBetween(new Date(), new Date(minDateResult));
      }
      blocksNum = blocksNumResult || 0;
    } catch (queryError) {
      console.error("Failed to query Roam data:", queryError);
    }

    const currentZoomContainer = document.querySelector(
      '[style="margin-left: -20px;"]'
    );
    const currentHighlightBlock = document.querySelector(
      ".roam-toolkit-block-mode--highlight"
    );

    if (currentZoomContainer || currentHighlightBlock) {
      const blockContainer = currentZoomContainer
        ? currentZoomContainer
        : currentHighlightBlock.parentElement?.parentElement;

      if (!blockContainer) {
        hideLoadingToast();
        alert("Unable to find block container. Please try again.");
        return;
      }

      updateLoadingToast("Extracting content...");

      // Extract content from the block
      const content = extractBlockContent(blockContainer);

      // Get block metadata
      const activeBlock = queryCurrentActiveBlockUID(
        currentZoomContainer
          ? currentZoomContainer.querySelector(".rm-block__self .rm-block-text")
          : currentHighlightBlock,
        blockContainer
      );

      const memo = { ...activeBlock };

      // Get settings
      const disableShowBlockAndDays = await extensionAPI.settings.get("disable-blocks-info-setting");

      updateLoadingToast("Rendering card...");

      // Create a wrapper container for the modern card
      const wrapper = document.createElement("div");
      wrapper.className = `modern-card-wrapper modern-card-container modern-card-container-${theme}`;
      wrapper.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: ${isMobile ? "320px" : "480px"};
        z-index: -1;
      `;

      const cardRoot = document.createElement("div");
      cardRoot.id = "modern-card-root";
      wrapper.appendChild(cardRoot);

      document.body.appendChild(wrapper);

      // Render the modern card
      renderModernCard(
        memo,
        content,
        blocksNum,
        usageDays,
        !disableShowBlockAndDays,
        extensionAPI,
        theme
      );

      // Wait for React to render (reduced from 100ms)
      await new Promise((resolve) => setTimeout(resolve, 50));

      updateLoadingToast("Generating image...");

      // Capture the card as image with optimized settings
      const options = {
        logging: false,
        scale: 2, // Reduced from 3 for better performance
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        removeContainer: false,
      };

      const canvas = await html2canvas(wrapper, options);
      const imageSrc = canvas.toDataURL("image/png", 0.92); // Slightly reduced quality for faster encoding

      updateLoadingToast("Downloading...");
      downloadImage(imageSrc, memo, isMobile);

      // Cleanup
      reset();
      hideLoadingToast();
    } else {
      hideLoadingToast();
      const shortcut = navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";
      alert(`Please zoom into the block you want to share (${shortcut}+.)`);
    }
  } catch (error) {
    console.error("Modern card share operation failed:", error);
    hideLoadingToast();
    alert("Failed to generate share image. Please try again.");
    reset();
  } finally {
    isProcessing = false;
  }
}

export async function shareAndDownloadImage(isMobile = false, extensionAPI) {
  // Prevent concurrent share operations
  if (isProcessing) {
    console.warn("Share operation already in progress");
    return;
  }

  isProcessing = true;
  showLoadingToast("Preparing...");

  try {
    const existing = document.getElementById("share-card");
    if (!existing) {
      const portal = document.querySelector(".bp3-portal");
      if (portal) {
        const element = document.createElement("div");
        element.id = "share-card";
        portal.appendChild(element);
      }
    }

    // Parallel API queries for better performance
    let usageDays = 0;
    let blocksNum = 0;

    try {
      const [minDateResult, blocksNumResult] = await Promise.all([
        roamAlphaAPI.q(queryMinDate),
        roamAlphaAPI.q(queryNonCodeBlocks),
      ]);

      if (minDateResult) {
        usageDays = daysBetween(new Date(), new Date(minDateResult));
      }
      blocksNum = blocksNumResult || 0;
    } catch (queryError) {
      console.error("Failed to query Roam data:", queryError);
    }

    const currentZoomContainer = document.querySelector(
      '[style="margin-left: -20px;"]'
    );
    const currentHighlightBlock = document.querySelector(
      ".roam-toolkit-block-mode--highlight"
    );

    if (currentZoomContainer || currentHighlightBlock) {
      const blockContainer = currentZoomContainer
        ? currentZoomContainer
        : currentHighlightBlock.parentElement?.parentElement;

      if (!blockContainer) {
        hideLoadingToast();
        alert("Unable to find block container. Please try again.");
        return;
      }

      updateLoadingToast("Building card...");

      blockContainer.classList.add("share-memex-container");

      const header = document.createElement("div");
      header.id = "share-card-header";
      blockContainer.prepend(header);

      const doubleLine = document.createElement("div");
      doubleLine.className = "double-line";
      header.after(doubleLine);

      const footer = document.createElement("div");
      footer.id = "share-card-footer";
      blockContainer.appendChild(footer);

      const activeBlock = queryCurrentActiveBlockUID(
        currentZoomContainer
          ? currentZoomContainer.querySelector(".rm-block__self .rm-block-text")
          : currentHighlightBlock,
        blockContainer
      );

      const memo = { ...activeBlock };

      renderHeader(memo, extensionAPI);
      renderFooter(blocksNum, usageDays);

      updateLoadingToast("Generating image...");
      await shareImage(memo, isMobile, extensionAPI);
      hideLoadingToast();
    } else {
      hideLoadingToast();
      const shortcut = navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";
      alert(`Please zoom into the block you want to share (${shortcut}+.)`);
    }
  } catch (error) {
    console.error("Share operation failed:", error);
    hideLoadingToast();
    alert("Failed to generate share image. Please try again.");
    reset();
  } finally {
    isProcessing = false;
  }
}

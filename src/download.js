import { html } from "htm/react";
import html2canvas from "html2canvas";
import { queryCurrentActiveBlockUID } from "./api/roamSelect";
import { queryMinDate, queryNonCodeBlocks } from "./api/roamQueries";
import { ClassicCard } from "./components/ClassicCard";
import { ModernCard, extractBlockContent } from "./components/ModernCard";
import { daysBetween } from "./utils/dateUtils";
import { downloadImage } from "./utils/imageUtils";

// Lock to prevent concurrent share operations
let isProcessing = false;

// Store React roots for proper cleanup
let cardRoot = null;

// Loading toast element
let loadingToast = null;

/**
 * Show loading toast with progress
 */
function showLoadingToast(message = "Generating image...") {
  hideLoadingToast();

  loadingToast = document.createElement("div");
  loadingToast.className = "share-card-loading-toast";
  loadingToast.innerHTML = `<div class="share-card-loading-spinner"></div><span class="share-card-loading-text">${message}</span>`;

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

/**
 * Render a card component to a container
 */
function renderCard(container, CardComponent, props) {
  if (!container) {
    console.error("Card container not found");
    return;
  }

  // Use createRoot API (React 18+)
  if (ReactDOM.createRoot) {
    cardRoot = ReactDOM.createRoot(container);
    cardRoot.render(html`<${CardComponent} ...${props} />`);
  } else {
    // Fallback for older React versions
    ReactDOM.render(html`<${CardComponent} ...${props} />`, container);
  }
}

/**
 * Clean up rendered card and container
 */
function cleanup() {
  // Unmount React root
  if (cardRoot) {
    cardRoot.unmount();
    cardRoot = null;
  }

  // Remove card wrapper
  const cardWrapper = document.querySelector(".share-card-wrapper");
  if (cardWrapper) {
    cardWrapper.remove();
  }
}

/**
 * Find the current zoomed block container
 */
function findBlockContainer() {
  const currentZoomContainer = document.querySelector(
    '[style="margin-left: -20px;"]'
  );
  const currentHighlightBlock = document.querySelector(
    ".roam-toolkit-block-mode--highlight"
  );

  if (!currentZoomContainer && !currentHighlightBlock) {
    return { container: null, blockElement: null };
  }

  const container = currentZoomContainer
    ? currentZoomContainer
    : currentHighlightBlock.parentElement?.parentElement;

  const blockElement = currentZoomContainer
    ? currentZoomContainer.querySelector(".rm-block__self .rm-block-text")
    : currentHighlightBlock;

  return { container, blockElement };
}

/**
 * Fetch Roam statistics (blocks count and usage days)
 */
async function fetchRoamStats() {
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

  return { usageDays, blocksNum };
}

/**
 * Create an off-screen wrapper for rendering and capturing the card
 */
function createOffscreenWrapper(className, width) {
  const wrapper = document.createElement("div");
  wrapper.className = `share-card-wrapper ${className}`;
  wrapper.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: ${width}px;
    z-index: -1;
  `;

  const root = document.createElement("div");
  root.id = "share-card-root";
  wrapper.appendChild(root);

  document.body.appendChild(wrapper);

  return { wrapper, root };
}

/**
 * Capture a DOM element as an image
 */
async function captureAsImage(element, options = {}) {
  const defaultOptions = {
    logging: false,
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    removeContainer: false,
  };

  const canvas = await html2canvas(element, { ...defaultOptions, ...options });
  return canvas.toDataURL("image/png", 0.92);
}

/**
 * Generate and download a Classic style card image
 */
export async function shareAndDownloadImage(extensionAPI) {
  if (isProcessing) {
    console.warn("Share operation already in progress");
    return;
  }

  isProcessing = true;
  showLoadingToast("Preparing...");

  try {
    const { container, blockElement } = findBlockContainer();

    if (!container) {
      hideLoadingToast();
      const shortcut = navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";
      alert(`Please zoom into the block you want to share (${shortcut}+.)`);
      return;
    }

    updateLoadingToast("Extracting content...");

    // Fetch stats and settings in parallel
    const [{ usageDays, blocksNum }, cardStyle, disableShowBlockAndDays] = await Promise.all([
      fetchRoamStats(),
      extensionAPI.settings.get("card-style"),
      extensionAPI.settings.get("disable-blocks-info-setting"),
    ]);

    // Extract content from the block
    const content = extractBlockContent(container);

    // Get block metadata
    const activeBlock = queryCurrentActiveBlockUID(blockElement, container);
    const memo = { ...activeBlock };

    updateLoadingToast("Rendering card...");

    // Create off-screen wrapper
    const { wrapper, root } = createOffscreenWrapper("classic-card-container", 640);

    // Render the classic card
    renderCard(root, ClassicCard, {
      block: memo,
      content,
      blocksNum,
      usageDays,
      showStats: !disableShowBlockAndDays,
      extensionAPI,
      cardStyle: cardStyle || "Default",
    });

    // Wait for React to render
    await new Promise((resolve) => setTimeout(resolve, 50));

    updateLoadingToast("Generating image...");

    // Capture the card as image
    const imageSrc = await captureAsImage(wrapper);

    updateLoadingToast("Downloading...");
    downloadImage(imageSrc, memo);

    // Cleanup
    cleanup();
    hideLoadingToast();
  } catch (error) {
    console.error("Classic card share operation failed:", error);
    hideLoadingToast();
    alert("Failed to generate share image. Please try again.");
    cleanup();
  } finally {
    isProcessing = false;
  }
}

/**
 * Generate and download a Modern style card image
 */
export async function shareModernCardImage(theme = "light", extensionAPI) {
  if (isProcessing) {
    console.warn("Share operation already in progress");
    return;
  }

  isProcessing = true;
  showLoadingToast("Preparing...");

  try {
    const { container, blockElement } = findBlockContainer();

    if (!container) {
      hideLoadingToast();
      const shortcut = navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";
      alert(`Please zoom into the block you want to share (${shortcut}+.)`);
      return;
    }

    updateLoadingToast("Extracting content...");

    // Fetch stats and settings in parallel
    const [{ usageDays, blocksNum }, disableShowBlockAndDays] = await Promise.all([
      fetchRoamStats(),
      extensionAPI.settings.get("disable-blocks-info-setting"),
    ]);

    // Extract content from the block
    const content = extractBlockContent(container);

    // Get block metadata
    const activeBlock = queryCurrentActiveBlockUID(blockElement, container);
    const memo = { ...activeBlock };

    updateLoadingToast("Rendering card...");

    // Create off-screen wrapper
    const { wrapper, root } = createOffscreenWrapper(
      `modern-card-container modern-card-container-${theme}`,
      480
    );

    // Render the modern card
    renderCard(root, ModernCard, {
      block: memo,
      content,
      blocksNum,
      usageDays,
      showStats: !disableShowBlockAndDays,
      extensionAPI,
      theme,
    });

    // Wait for React to render
    await new Promise((resolve) => setTimeout(resolve, 50));

    updateLoadingToast("Generating image...");

    // Capture the card as image
    const imageSrc = await captureAsImage(wrapper);

    updateLoadingToast("Downloading...");
    downloadImage(imageSrc, memo);

    // Cleanup
    cleanup();
    hideLoadingToast();
  } catch (error) {
    console.error("Modern card share operation failed:", error);
    hideLoadingToast();
    alert("Failed to generate share image. Please try again.");
    cleanup();
  } finally {
    isProcessing = false;
  }
}

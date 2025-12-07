import { html } from "htm/react";
import html2canvas from "html2canvas";
import { queryCurrentActiveBlockUID } from "./api/roamSelect";
import { queryMinDate, queryNonCodeBlocks } from "./api/roamQueries";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { daysBetween } from "./utils/dateUtils";
import { downloadImage } from "./utils/imageUtils";

// Lock to prevent concurrent share operations
let isProcessing = false;

// Store React roots for proper cleanup
let headerRoot = null;
let footerRoot = null;

export function renderFooter(blocksNum, usageDays, memo) {
  const container = document.getElementById("share-card-footer");
  if (!container) {
    console.error("Footer container not found");
    return;
  }

  // Use createRoot API (React 18+)
  if (ReactDOM.createRoot) {
    footerRoot = ReactDOM.createRoot(container);
    footerRoot.render(
      html`<${Footer}
        blocksNum=${blocksNum}
        usageDays=${usageDays}
        block=${memo}
      />`
    );
  } else {
    // Fallback for older React versions
    ReactDOM.render(
      html`<${Footer}
        blocksNum=${blocksNum}
        usageDays=${usageDays}
        block=${memo}
      />`,
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

export async function shareImage(memo, isMobile, extensionAPI) {
  const node = document.querySelector(".share-memex-container");
  if (!node) {
    throw new Error("Share container not found");
  }
  const originalStyles = node.style.cssText;

  if (isMobile) {
    node.style.setProperty("width", "320px", "important");

    const authorElement = node.querySelector(
      "#share-card-header .memo .author"
    );
    if (authorElement) {
      authorElement.style.setProperty("width", "100%", "important");
    }
  } else {
    node.style.setProperty("width", "640px", "important");

    let headerMemo = node.querySelector("#share-card-header .memo");
    if (headerMemo) {
      headerMemo.style.justifyContent = "space-between";
      headerMemo.style.alignItems = "center";
      headerMemo.style.flexDirection = "initial";
    }

    let footerElement = node.querySelector("#share-card-footer .footer");
    if (footerElement) {
      footerElement.style.justifyContent = "space-between";
      footerElement.style.alignItems = "center";
      footerElement.style.flexDirection = "initial";
      footerElement.style.padding = "0 20px 10px";
    }

    let timeElement = node.querySelector("#share-card-header .memo .time");
    if (timeElement) {
      timeElement.style.textAlign = "right";
    }
  }

  const roamArticle = document.querySelector(".roam-article");
  if (roamArticle) {
    roamArticle.style.color = "#202B33";
  }

  const options = {
    logging: false,
    scale: 3,
    useCORS: true,
    letterRendering: true,
  };

  const cardStyle = await extensionAPI.settings.get("card-style");
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

  const disableShowBlockAndDays = await extensionAPI.settings.get(
    "disable-blocks-info-setting"
  );
  const footerStatElement = document.querySelector(
    "#share-card-footer .footer .stat"
  );
  if (disableShowBlockAndDays && footerStatElement) {
    footerStatElement.style.display = "none";
  }

  const canvas = await html2canvas(node, options);

  const imageSrc = canvas.toDataURL("image/png", 1);

  downloadImage(imageSrc, memo, isMobile);

  // reset header and footer
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
}

export async function shareAndDownloadImage(isMobile = false, extensionAPI) {
  // Prevent concurrent share operations
  if (isProcessing) {
    console.warn("Share operation already in progress");
    return;
  }

  isProcessing = true;

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
      // Continue with default values
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
        alert("Unable to find block container. Please try again.");
        return;
      }

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
      renderFooter(blocksNum, usageDays, memo);

      await shareImage(memo, isMobile, extensionAPI);
    } else {
      const shortcut = navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";
      alert(`Please zoom into the block you want to share (${shortcut}+.)`);
    }
  } catch (error) {
    console.error("Share operation failed:", error);
    alert("Failed to generate share image. Please try again.");
    // Attempt cleanup on error
    reset();
  } finally {
    isProcessing = false;
  }
}

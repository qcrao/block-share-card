import { html } from "htm/react";
import html2canvas from "html2canvas";
import { queryCurrentActiveBlockUID } from "./api/roamSelect";
import { queryMinDate, queryNonCodeBlocks } from "./api/roamQueries";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { daysBetween } from "./utils/dateUtils";
import { downloadImage } from "./utils/imageUtils";

export function renderFooter(blocksNum, usageDays, memo) {
  ReactDOM.render(
    html`<${Footer}
      blocksNum=${blocksNum}
      usageDays=${usageDays}
      block=${memo}
    />`,
    document.getElementById("share-card-footer")
  );
}

export function renderHeader(memo, extensionAPI) {
  ReactDOM.render(
    html`<${Header} block=${memo} extensionAPI=${extensionAPI} />`,
    document.getElementById("share-card-header")
  );
}

export async function shareImage(memo, isMobile, extensionAPI) {
  const node = document.querySelector(".share-memex-container");
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
  document.querySelector("#share-card-header").remove();
  document.querySelector("#share-card-footer").remove();
  document
    .querySelector(".share-memex-container")
    .classList.remove("share-memex-container");

  const roamArticle = document.querySelector(".roam-article");
  if (roamArticle) {
    roamArticle.style.removeProperty("color");
  }
}

export async function shareAndDownloadImage(isMobile = false, extensionAPI) {
  const existing = document.getElementById("share-card");
  if (!existing) {
    const element = document.createElement("div");
    element.id = "share-card";
    document.querySelector(".bp3-portal").appendChild(element);
  }

  const min_date = await roamAlphaAPI.q(queryMinDate);
  const usageDays = daysBetween(new Date(), new Date(min_date));
  const blocksNum = await roamAlphaAPI.q(queryNonCodeBlocks);

  const currentZoomContainer = document.querySelector(
    '[style="margin-left: -20px;"]'
  );
  const currentHighlightBlock = document.querySelector(
    ".roam-toolkit-block-mode--highlight"
  );

  // block-highlight-blue rm-block__self rm-block__input
  if (currentZoomContainer || currentHighlightBlock) {
    const blockContainer = currentZoomContainer
      ? currentZoomContainer
      : currentHighlightBlock.parentElement?.parentElement;

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

    const imageSrc = await shareImage(memo, isMobile, extensionAPI);
  } else {
    alert("😜 Please zoom into(CMD+.) the block you want to share!");
  }
}

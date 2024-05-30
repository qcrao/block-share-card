import { html } from "htm/react";
import html2canvas from "html2canvas";
import { getBlockInfoByUID, queryCurrentActiveBlockUID } from "./api/roamAPI";
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
      block=${memo} />`,
    document.getElementById("share-card-footer")
  );
}

export function renderHeader(memo) {
  ReactDOM.render(
    html`<${Header} block=${memo} />`,
    document.getElementById("share-card-header")
  );
}

export async function shareImage(memo, isMobile) {
  const node = document.querySelector(".share-memex-container");
  const originalStyles = node.style.cssText; // 保存原始样式

  if (isMobile) {
    node.style.setProperty("width", "320px", "important");
  } else {
    node.style.setProperty("width", "640px", "important");

    // 在 #share-card-header .memo 增加 CSS
    let headerMemo = node.querySelector("#share-card-header .memo");
    if (headerMemo) {
      headerMemo.style.justifyContent = "space-between";
      headerMemo.style.alignItems = "center";
      headerMemo.style.flexDirection = "initial";
    }

    // 在 #share-card-footer .footer 增加 CSS
    let footerElement = node.querySelector("#share-card-footer .footer");
    if (footerElement) {
      footerElement.style.justifyContent = "space-between";
      footerElement.style.alignItems = "center";
      footerElement.style.flexDirection = "initial";
      footerElement.style.padding = "0 20px 10px";
    }

    // 在 #share-card-header .memo .time 增加 CSS
    let timeElement = node.querySelector("#share-card-header .memo .time");
    if (timeElement) {
      timeElement.style.textAlign = "right";
    }
  }

  // 生成图片
  const canvas = await html2canvas(node, {
    logging: false,
    scale: 3,
    useCORS: true,
    letterRendering: true,
    backgroundColor: "#FEFCF6",
  });

  const imageSrc = canvas.toDataURL("image/png", 1);

  // replaceAsImage(imageSrc);
  downloadImage(imageSrc, memo);
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
}

export async function shareAndDownloadImage(isMobile = false) {
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

    // 创建双横线元素
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
    const blockInfo = await getBlockInfoByUID(activeBlock.uid);
    console.log("blockInfo", activeBlock, blockInfo);

    const memo = { ...activeBlock, ...blockInfo };

    renderHeader(memo);
    renderFooter(blocksNum, usageDays, memo);

    const imageSrc = await shareImage(memo, isMobile);
  } else {
    alert("😜 Please zoom into(CMD+.) the block you want to share!");
  }
}

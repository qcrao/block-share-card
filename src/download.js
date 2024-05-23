import html2canvas from "html2canvas";
import { html } from "htm/react";

const queryNonCodeBlocks = `[:find (count ?s) . :with ?e  :where [?e :block/string ?s]  
					(not (or [(clojure.string/starts-with? ?s "${String.fromCharCode(
            96,
            96,
            96
          )}")] 
									 [(clojure.string/starts-with? ?s "{{")]
 	 								 [(clojure.string/starts-with? ?s "<%")]
									 [(clojure.string/starts-with? ?s"> ")]
									 [(clojure.string/starts-with? ?s"[[>]] ")]										 
  								 [(clojure.string/starts-with? ?s ":q ")]))]`;

const queryMinDate =
  "[:find (min ?date) . :where [?e :node/title ?name] [?e :create/time ?date] ]";

const queryCurrentActiveBlockUID = (blockElement, blockContainer) => {
  return {
    uid: blockElement.id.slice(-9),
    username: document
      .querySelector("[data-edit-display-name]")
      ?.getAttribute("data-edit-display-name"),
    tags: JSON.parse(blockContainer?.getAttribute("data-page-links")) || [],
  };
};

const getBlockInfoByUID = async (
  uid,
  withChildren = false,
  withParents = false
) => {
  try {
    let q = `[:find (pull ?page
                       [:node/title :block/string :block/uid :block/heading :block/props 
                        :entity/attrs :block/open :block/text-align :children/view-type
                        :block/order :create/time :user/display-name
                        ${withChildren ? "{:block/children ...}" : ""}
                        ${withParents ? "{:block/parents ...}" : ""}
                       ])
                    :where [?page :block/uid "${uid}"]  ]`;
    var results = await window.roamAlphaAPI.q(q);
    if (results.length == 0) return null;
    return results[0][0];
  } catch (e) {
    return null;
  }
};

function renderFooter(blocksNum, usageDays, memo) {
  ReactDOM.render(
    html`<${Footer}
      blocksNum=${blocksNum}
      usageDays=${usageDays}
      block=${memo} />`,
    document.getElementById("share-card-footer")
  );
}

export function Footer({ blocksNum, usageDays, block }) {
  return (
    <>
      <div className="footer">
        <div className="stat">
          <span>{blocksNum} BLOCKS · </span>
          <span>{usageDays} DAYS</span>
        </div>
        <div className="author">
          <span className="at">𐃏</span>
          <span className="username">
            <a href="https://qcrao.com">QCRAO.COM</a>
          </span>
        </div>
      </div>
      <img src="" className="share-card" />
    </>
  );
}

export function Header({ block }) {
  return (
    <div className="memo">
      <div className="time">
        {new Date(block.time).toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })}
      </div>
      <div className="content">
        <p>{block.string}</p>
        <p />
        <p>
          <span className="tag">{"#" + block.tags.join("# ")}</span>
        </p>
      </div>
    </div>
  );
}

function renderHeader(memo) {
  ReactDOM.render(
    html`<${Header} block=${memo} />`,
    document.getElementById("share-card-header")
  );
}

// https://stackoverflow.com/questions/2627473/how-to-calculate-the-number-of-days-between-two-dates
export function daysBetween(date1, date2) {
  // The number of milliseconds in one day
  const ONE_DAY = 1000 * 60 * 60 * 24;

  // Calculate the difference in milliseconds
  const differenceMs = Math.abs(date1 - date2);

  // Convert back to days and return
  return Math.round(differenceMs / ONE_DAY);
}

export async function shareAndDownloadImage() {
  console.log("🎨 shareAndDownloadImage(=====>)");
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

    const imageSrc = await shareImage(memo);
    // TODO: initMenuOption()
  } else {
    alert("🎨 Please Zoom into(CMD+.) the block you want to share...");
  }
}

async function shareImage(memo) {
  const node = document.querySelector(".share-memex-container");
  const originalStyles = node.style.cssText; // 保存原始样式
  // node.style.width = '320px'
  node.style.setProperty("width", "320px", "important");
  // node.style.setProperty('height', '100px', 'important')

  // 延迟以确保样式应用和元素重绘
  // await new Promise((resolve) => setTimeout(resolve, 1500))

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

export const downloadImage = (imageUrl, memo) => {
  const anchorElement = document.createElement("a");
  anchorElement.href = imageUrl;
  anchorElement.download = memo.username + "-" + memo.uid + ".png";

  const event = document.createEvent("MouseEvents");
  event.initEvent("click", true, true);

  anchorElement.dispatchEvent(event);
};

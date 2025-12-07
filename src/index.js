import React from "react";
import ReactDOM from "react-dom";
import BlockShareCardComponent from "./components/BlockShareCardComponent";
import "@blueprintjs/core/lib/css/blueprint.css";
import { initPanelConfig } from "./panelConfig.js";

const rootId = "share-card-root";

function onload({ extensionAPI }) {
  const panelConfig = initPanelConfig(extensionAPI);
  extensionAPI.settings.panel.create(panelConfig);

  const blockShareCardContainer = document.createElement("span");
  blockShareCardContainer.id = rootId;
  ReactDOM.render(
    <BlockShareCardComponent extensionAPI={extensionAPI} />,
    blockShareCardContainer
  );

  const container = document.getElementsByClassName("rm-topbar")[0];
  const searchDiv = document.getElementsByClassName(
    "rm-find-or-create-wrapper"
  )[0];

  if (container && searchDiv) {
    container.insertBefore(blockShareCardContainer, searchDiv.nextSibling);
  } else {
    console.error("Could not find toolbar elements to insert share card button");
  }
}

function onunload() {
  const blockShareCardContainer = document.getElementById(rootId);

  if (blockShareCardContainer) {
    ReactDOM.unmountComponentAtNode(blockShareCardContainer);
    blockShareCardContainer.remove();
  }
}

export default {
  onload,
  onunload,
};

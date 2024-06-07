import React from "react";
import ReactDOM from "react-dom";
import { Menu, MenuItem } from "@blueprintjs/core";
import { IconSize } from "@blueprintjs/icons";
import BlockShareCardComponent from "./components/BlockShareCardComponent";
import "@blueprintjs/core/lib/css/blueprint.css";
import { initPanelConfig } from "./panelConfig.js";

console.log("block share card loading");

const rootId = "share-card-root";

function onload({ extensionAPI, ...rest }) {
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
  container.insertBefore(blockShareCardContainer, searchDiv.nextSibling);

  console.log("Loaded block share card container");
}

function onunload() {
  const blockShareCardContainer = document.getElementById(rootId);

  ReactDOM.unmountComponentAtNode(blockShareCardContainer);
  blockShareCardContainer.remove();

  console.log("Unloaded block share card");
}

export default {
  onload: onload,
  onunload: onunload,
};

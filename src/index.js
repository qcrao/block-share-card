import React from "react";
import ReactDOM from "react-dom";
import BlockShareCardComponent from "./components/BlockShareCardComponent";
import "@blueprintjs/core/lib/css/blueprint.css";
import { initPanelConfig } from "./panelConfig.js";
import { shareAndDownloadImage, shareModernCardImage } from "./download.js";

const rootId = "share-card-root";

const COMMAND_CLASSIC = "Share Block Card - Classic";
const COMMAND_MODERN_LIGHT = "Share Block Card - Modern Light";
const COMMAND_MODERN_DARK = "Share Block Card - Modern Dark";

function onload({ extensionAPI }) {
  const panelConfig = initPanelConfig(extensionAPI);
  extensionAPI.settings.panel.create(panelConfig);

  // Register Command Palette commands
  extensionAPI.ui.commandPalette.addCommand({
    label: COMMAND_CLASSIC,
    callback: () => shareAndDownloadImage(extensionAPI),
  });
  extensionAPI.ui.commandPalette.addCommand({
    label: COMMAND_MODERN_LIGHT,
    callback: () => shareModernCardImage("light", extensionAPI),
  });
  extensionAPI.ui.commandPalette.addCommand({
    label: COMMAND_MODERN_DARK,
    callback: () => shareModernCardImage("dark", extensionAPI),
  });

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

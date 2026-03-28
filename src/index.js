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

  // Initialize default for show-toolbar-icon if not set
  if (extensionAPI.settings.get("show-toolbar-icon") === null) {
    extensionAPI.settings.set("show-toolbar-icon", true);
  }

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

  function addToolbarIcon() {
    if (document.getElementById(rootId)) return;
    const blockShareCardContainer = document.createElement("span");
    blockShareCardContainer.id = rootId;
    ReactDOM.render(
      <BlockShareCardComponent extensionAPI={extensionAPI} />,
      blockShareCardContainer
    );
    const container = document.getElementsByClassName("rm-topbar")[0];
    if (container) {
      container.appendChild(blockShareCardContainer);
    } else {
      console.error("Could not find toolbar elements to insert share card button");
    }
  }

  function removeToolbarIcon() {
    const el = document.getElementById(rootId);
    if (el) {
      ReactDOM.unmountComponentAtNode(el);
      el.remove();
    }
  }

  if (extensionAPI.settings.get("show-toolbar-icon") !== false) {
    addToolbarIcon();
  }

  window._blockShareCardToggleIcon = (show) => {
    if (show) {
      addToolbarIcon();
    } else {
      removeToolbarIcon();
    }
  };
}

function onunload() {
  const blockShareCardContainer = document.getElementById(rootId);

  if (blockShareCardContainer) {
    ReactDOM.unmountComponentAtNode(blockShareCardContainer);
    blockShareCardContainer.remove();
  }

  delete window._blockShareCardToggleIcon;
}

export default {
  onload,
  onunload,
};

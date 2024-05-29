import React from "react";
import ReactDOM from "react-dom";
import { Menu, MenuItem } from "@blueprintjs/core";
import { IconSize } from "@blueprintjs/icons";
import BlockShareCardComponent from "./components/BlockShareCardComponent";
import "@blueprintjs/core/lib/css/blueprint.css";

console.log("block share card loading");

const rootId = "share-card-root"; // 使用一致的根元素ID

function onload() {
  const container = document.getElementsByClassName("rm-topbar")[0];
  const blockShareCardContainer = document.createElement("div");

  blockShareCardContainer.id = rootId; // 正确设置 ID
  ReactDOM.render(<BlockShareCardComponent />, blockShareCardContainer);

  container.appendChild(blockShareCardContainer); // 正确地添加元素到 DOM
  console.log("Loaded block share card container");
}

function onunload() {
  const blockShareCardContainer = document.getElementById(rootId); // 确保使用相同的 ID

  ReactDOM.unmountComponentAtNode(blockShareCardContainer);
  blockShareCardContainer.remove();

  console.log("Unloaded block share card");
}

export default {
  onload: onload,
  onunload: onunload,
};

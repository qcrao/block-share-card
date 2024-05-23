import React from "react";
import ReactDOM from "react-dom";
import { Menu, MenuItem } from "@blueprintjs/core";
import { IconSize } from "@blueprintjs/icons";
import BlockShareCardComponent from "./BlockShareCardComponent";

console.log("block share card loading");

const rootId = "share-card-root"; // 使用一致的根元素ID

function blockShareCardComponent() {
  // 使用 React.createElement 构建嵌套菜单结构
  const menuStructure = React.createElement(
    Menu,
    {},
    React.createElement(
      MenuItem,
      { text: "", icon: "send-to" },
      React.createElement(
        Menu,
        {},
        React.createElement(MenuItem, {
          text: "",
          icon: "mobile-phone",
        }),
        React.createElement(MenuItem, {
          text: "",
          icon: "desktop",
        })
      )
    )
  );

  return menuStructure;
}

function onload() {
  const container = document.getElementsByClassName("rm-topbar")[0];
  const blockShareCardContainer = document.createElement("span");

  blockShareCardContainer.id = rootId; // 正确设置 ID
  container.appendChild(blockShareCardContainer); // 正确地添加元素到 DOM

  ReactDOM.render(<BlockShareCardComponent />, blockShareCardContainer);

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

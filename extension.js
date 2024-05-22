import { Menu, MenuItem } from "@blueprintjs/core";

console.log("block share card loading");

const rootId = "share-card-root";

function blockShareCardComponent() {
  // 使用 React.createElement 构建嵌套菜单结构
  const menuStructure = React.createElement(
    Menu,
    {},
    React.createElement(
      MenuItem,
      { text: "Submenu", icon: "document" },
      React.createElement(
        Menu,
        {},
        React.createElement(MenuItem, {
          text: "Child one",
          icon: "new-text-box",
        }),
        React.createElement(MenuItem, {
          text: "Child two",
          icon: "new-object",
        }),
        React.createElement(MenuItem, { text: "Child three", icon: "new-link" })
      )
    )
  );

  return menuStructure;
}

function onload() {
  const container = document.getElementsByClassName("rm-topbar")[0];
  const blockShareCardContainer = document.createElement("span");

  blockShareCardContainer.id = rm - topbar;
  container.insertAdjacentElement(blockShareCardContainer, container.lastChild);

  ReactDOM.render(
    React.createElement(blockShareCardComponent),
    blockShareCardContainer
  );

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

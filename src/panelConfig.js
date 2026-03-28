export function initPanelConfig(extensionAPI) {
  return {
    tabTitle: "Block Share Card",
    settings: [
      {
        id: "card-style",
        name: "Card style",
        description: "Select the style of the card",
        action: {
          type: "select",
          items: ["Default", "Vanilla Roam"],
          onChange: async (evt) => {
            await extensionAPI.settings.set("card-style", evt);
          },
        },
      },
      {
        id: "create-edit-time",
        name: "Time display",
        description: "Show the create or edit time of the block",
        action: {
          type: "select",
          items: ["Edit Time", "Create Time"],
          onChange: async (evt) => {
            await extensionAPI.settings.set("create-edit-time", evt);
          },
        },
      },
      {
        id: "show-toolbar-icon",
        name: "Show toolbar icon",
        description: "Show the share card icon in the toolbar",
        action: {
          type: "switch",
          onChange: async (evt) => {
            const checked = typeof evt === "boolean" ? evt : evt?.target?.checked;
            await extensionAPI.settings.set("show-toolbar-icon", checked);
            if (window._blockShareCardToggleIcon) {
              window._blockShareCardToggleIcon(checked);
            }
          },
        },
      },
      {
        id: "disable-blocks-info-setting",
        name: "Hide blocks and days",
        description: "Hide the number of blocks and days",
        action: {
          type: "switch",
          onChange: async (evt) => {
            await extensionAPI.settings.set(
              "disable-blocks-info-setting",
              evt.target.checked
            );
          },
        },
      },
    ],
  };
}

export function initPanelConfig(extensionAPI) {
  return {
    tabTitle: "Block Share Card",
    settings: [
      {
        id: "card-style",
        name: "Select card style",
        action: {
          type: "select",
          items: ["Default", "Vanilla Roam"],
          onChange: async (evt) => {
            await extensionAPI.settings.set("card-style", evt);
          },
        },
      },
      {
        id: "disable-blocks-info-setting",
        name: "Disable Blocks And Days",
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

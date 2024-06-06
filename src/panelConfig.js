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
            console.log("Select Changed!", evt);
            await extensionAPI.settings.set("card-style", evt);
          },
        },
      },
      {
        id: "show-blocks-info-setting",
        name: "Show Blocks And Days",
        action: {
          type: "switch",
          onChange: async (evt) => {
            console.log("Switch!", evt.target.checked);
            await extensionAPI.settings.set(
              "show-blocks-info-setting",
              evt.target.checked
            );
          },
        },
      },
    ],
  };
}

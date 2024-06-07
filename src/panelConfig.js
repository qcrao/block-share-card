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

export const panelConfig = {
  tabTitle: "Block Share Card",
  settings: [
    {
      id: "card-style",
      name: "Select card style",
      action: {
        type: "select",
        items: ["Default", "vanilla Roam"],
        onChange: (evt) => {
          console.log("Select Changed!", evt);
        },
      },
    },
    {
      id: "show-blocks-info-setting",
      name: "Show Blocks And Days",
      action: {
        type: "switch",
        onChange: (evt) => {
          console.log("Switch!", evt);
        },
      },
    },
  ],
};

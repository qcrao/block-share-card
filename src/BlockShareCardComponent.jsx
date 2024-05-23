import React from "react";
import { Button, Menu, MenuItem, Popover } from "@blueprintjs/core";
import { shareAndDownloadImage } from "./download.js";

function BlockShareCardComponent() {
  const handleClick = (item) => {
    console.log(`Clicked on ${item}`);
  };

  const menu = (
    <Menu>
      <MenuItem
        icon="mobile-phone"
        text="mobile"
        onClick={() => shareAndDownloadImage()}
      />
      <MenuItem
        icon="desktop"
        text="desktop"
        onClick={() => handleClick("desktop")}
      />
    </Menu>
  );

  return (
    <Popover content={menu} placement="bottom">
      <Button icon="send-to" text="" />
    </Popover>
  );
}

export default BlockShareCardComponent;

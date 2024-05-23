import React from "react";
import { Button, Menu, MenuItem, Popover } from "@blueprintjs/core";

function BlockShareCardComponent() {
  const menu = (
    <Menu>
      <MenuItem icon="mobile-phone" text="mobile" />
      <MenuItem icon="desktop" text="desktop" />
    </Menu>
  );

  return (
    <Popover content={menu} placement="bottom">
      <Button icon="send-to" text="" />
    </Popover>
  );
}

export default BlockShareCardComponent;

import React, { useState } from "react";
import { Button, Menu, MenuItem, MenuDivider, Popover, Tooltip } from "@blueprintjs/core";
import { shareAndDownloadImage, shareModernCardImage } from "../download.js";

function BlockShareCardComponent({ extensionAPI }) {
  const [isOpen, setIsOpen] = useState(false);

  const closePopover = () => setIsOpen(false);

  const menu = (
    <Menu>
      <MenuItem
        icon="style"
        text="Classic"
        onClick={() => {
          shareAndDownloadImage(extensionAPI);
          closePopover();
        }}
      />
      <MenuDivider />
      <MenuItem
        icon="clean"
        text="Modern Light"
        onClick={() => {
          shareModernCardImage("light", extensionAPI);
          closePopover();
        }}
      />
      <MenuItem
        icon="moon"
        text="Modern Dark"
        onClick={() => {
          shareModernCardImage("dark", extensionAPI);
          closePopover();
        }}
      />
    </Menu>
  );

  return (
    <Popover
      content={menu}
      isOpen={isOpen}
      onInteraction={(state) => setIsOpen(state)}>
      <span>
        <Tooltip content="Share block card" placement="bottom">
          <Button
            className="bp3-button bp3-minimal bp3-small"
            icon="send-to"
            text=""
          />
        </Tooltip>
      </span>
    </Popover>
  );
}

export default BlockShareCardComponent;

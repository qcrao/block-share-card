import React, { useState } from "react";
import { Button, Menu, MenuItem, MenuDivider, Popover, Tooltip } from "@blueprintjs/core";
import { shareAndDownloadImage, shareModernCardImage } from "../download.js";

function BlockShareCardComponent({ extensionAPI }) {
  const [isOpen, setIsOpen] = useState(false);

  const togglePopover = () => setIsOpen(!isOpen);
  const closePopover = () => setIsOpen(false);

  const menu = (
    <Menu>
      <MenuItem icon="style" text="Classic">
        <MenuItem
          icon="mobile-phone"
          text="Mobile"
          onClick={() => {
            shareAndDownloadImage(true, extensionAPI);
            closePopover();
          }}
        />
        <MenuItem
          icon="desktop"
          text="Desktop"
          onClick={() => {
            shareAndDownloadImage(false, extensionAPI);
            closePopover();
          }}
        />
      </MenuItem>
      <MenuDivider />
      <MenuItem icon="clean" text="Modern Light">
        <MenuItem
          icon="mobile-phone"
          text="Mobile"
          onClick={() => {
            shareModernCardImage(true, "light", extensionAPI);
            closePopover();
          }}
        />
        <MenuItem
          icon="desktop"
          text="Desktop"
          onClick={() => {
            shareModernCardImage(false, "light", extensionAPI);
            closePopover();
          }}
        />
      </MenuItem>
      <MenuItem icon="moon" text="Modern Dark">
        <MenuItem
          icon="mobile-phone"
          text="Mobile"
          onClick={() => {
            shareModernCardImage(true, "dark", extensionAPI);
            closePopover();
          }}
        />
        <MenuItem
          icon="desktop"
          text="Desktop"
          onClick={() => {
            shareModernCardImage(false, "dark", extensionAPI);
            closePopover();
          }}
        />
      </MenuItem>
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
            onClick={togglePopover}
          />
        </Tooltip>
      </span>
    </Popover>
  );
}

export default BlockShareCardComponent;

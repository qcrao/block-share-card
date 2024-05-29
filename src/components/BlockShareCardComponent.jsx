import React, { useState } from "react";
import { Button, Menu, MenuItem, Popover, Tooltip } from "@blueprintjs/core";
import { shareAndDownloadImage } from "../download.js";

function BlockShareCardComponent() {
  const [isOpen, setIsOpen] = useState(false);

  const togglePopover = () => setIsOpen(!isOpen);
  const closePopover = () => setIsOpen(false);

  const menu = (
    <Menu>
      <MenuItem
        icon="mobile-phone"
        text="Mobile"
        onClick={() => {
          shareAndDownloadImage(true);
          closePopover();
        }}
      />
      <MenuItem
        icon="desktop"
        text="Desktop"
        onClick={() => {
          shareAndDownloadImage(false);
          closePopover();
        }}
      />
    </Menu>
  );

  return (
    <Popover
      content={menu}
      isOpen={isOpen}
      onInteraction={(state) => setIsOpen(state)}
    >
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

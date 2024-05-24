import React from "react";
import { Button, Menu, MenuItem, Popover } from "@blueprintjs/core";
import { shareAndDownloadImage } from "../download.js";

function BlockShareCardComponent() {
  const [isMobile, setIsMobile] = useState(false);

  const handleClick = (item) => {
    console.log(`Clicked on ${item}`);
    setIsMobile(item === "mobile"); // 设置状态依据点击的是哪个选项
  };

  // 使用 useEffect 钩子来处理状态变化后的操作
  useEffect(() => {
    if (isMobile !== undefined) {
      shareAndDownloadImage(isMobile);
    }
  }, [isMobile]); // 依赖数组中包括 isMobile

  const menu = (
    <Menu>
      <MenuItem
        icon="mobile-phone"
        text="mobile"
        onClick={() => handleClick("mobile")}
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
      <Button className="bp3-button bp3-minimal" icon="send-to" text="" />
    </Popover>
  );
}

export default BlockShareCardComponent;

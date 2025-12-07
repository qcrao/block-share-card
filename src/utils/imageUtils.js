export const downloadImage = (imageUrl, memo, isMobile) => {
  const anchorElement = document.createElement("a");
  anchorElement.href = imageUrl;
  // add mobile or pc to the filename
  const username = memo.username || "unknown";
  const uid = memo.uid || "block";
  anchorElement.download =
    username + "-" + uid + (isMobile ? "-mobile" : "-desktop") + ".png";

  // Use modern MouseEvent constructor instead of deprecated createEvent/initEvent
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window,
  });

  anchorElement.dispatchEvent(event);
};

export const downloadImage = (imageUrl, memo) => {
  const anchorElement = document.createElement("a");
  anchorElement.href = imageUrl;
  const username = memo.username || "unknown";
  const uid = memo.uid || "block";
  anchorElement.download = username + "-" + uid + ".png";

  // Use modern MouseEvent constructor instead of deprecated createEvent/initEvent
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window,
  });

  anchorElement.dispatchEvent(event);
};

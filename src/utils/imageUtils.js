
export const downloadImage = (imageUrl, memo) => {
  const anchorElement = document.createElement("a");
  anchorElement.href = imageUrl;
  anchorElement.download = memo.username + "-" + memo.uid + ".png";

  const event = document.createEvent("MouseEvents");
  event.initEvent("click", true, true);

  anchorElement.dispatchEvent(event);
};

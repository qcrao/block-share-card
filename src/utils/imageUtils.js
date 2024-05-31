export const downloadImage = (imageUrl, memo, isMobile) => {
  const anchorElement = document.createElement("a");
  anchorElement.href = imageUrl;
  // add mobile or pc to the filename
  anchorElement.download =
    memo.username +
    "-" +
    memo.uid +
    (isMobile ? "-mobile" : "-desktop") +
    ".png";
  const event = document.createEvent("MouseEvents");
  event.initEvent("click", true, true);

  anchorElement.dispatchEvent(event);
};

/**
 * Generate a short random hash similar to git commit short hash
 */
function generateShortHash(length = 7) {
  const chars = "0123456789abcdef";
  let hash = "";
  for (let i = 0; i < length; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export const downloadImage = (imageUrl, memo) => {
  const anchorElement = document.createElement("a");
  anchorElement.href = imageUrl;
  const username = memo.username || "unknown";
  const uid = memo.uid || "block";
  const shortHash = generateShortHash();
  anchorElement.download = `${username}-${uid}-${shortHash}.png`;

  // Use modern MouseEvent constructor instead of deprecated createEvent/initEvent
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window,
  });

  anchorElement.dispatchEvent(event);
};

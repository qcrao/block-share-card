export const queryCurrentActiveBlockUID = (blockElement, blockContainer) => {
  const editTimeStr = document
    .querySelector("[data-edit-time]")
    ?.getAttribute("data-edit-time");
  const createTimeStr = document
    .querySelector("[data-create-time]")
    ?.getAttribute("data-create-time");

  // Safely extract UID from block element
  const uid = blockElement?.id ? blockElement.id.slice(-9) : "unknown";

  // Get username with fallback
  const username =
    document
      .querySelector("[data-edit-display-name]")
      ?.getAttribute("data-edit-display-name") || "Unknown";

  // Parse tags safely
  let tags = [];
  try {
    const tagsAttr = blockContainer?.getAttribute("data-page-links");
    if (tagsAttr) {
      tags = JSON.parse(tagsAttr);
    }
  } catch (e) {
    console.error("Failed to parse page links:", e);
  }

  // Parse times with fallback to current timestamp
  const now = Date.now();
  const editTime = editTimeStr ? parseInt(editTimeStr, 10) : now;
  const createTime = createTimeStr ? parseInt(createTimeStr, 10) : now;

  return {
    uid,
    username,
    tags,
    editTime: isNaN(editTime) ? now : editTime,
    createTime: isNaN(createTime) ? now : createTime,
  };
};

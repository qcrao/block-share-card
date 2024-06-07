export const queryCurrentActiveBlockUID = (blockElement, blockContainer) => {
  const editTimeStr = document
    .querySelector("[data-edit-time]")
    ?.getAttribute("data-edit-time");
  const createTimeStr = document
    .querySelector("[data-create-time]")
    ?.getAttribute("data-create-time");

  return {
    uid: blockElement.id.slice(-9),
    username: document
      .querySelector("[data-edit-display-name]")
      ?.getAttribute("data-edit-display-name"),
    tags: JSON.parse(blockContainer?.getAttribute("data-page-links")) || [],
    editTime: parseInt(editTimeStr, 10),
    createTime: parseInt(createTimeStr, 10),
  };
};

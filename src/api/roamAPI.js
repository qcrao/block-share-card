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

export const getBlockInfoByUID = async (
  uid,
  withChildren = false,
  withParents = false
) => {
  try {
    let q = `[:find ?edit/time ?create/time
                    :where [?page :block/uid "${uid}"]  ]`;

    var results = await window.roamAlphaAPI.q(q);
    if (results.length == 0) return null;
    console.log("results==>", results);
    console.log("uid==>", uid);

    return results[0][0];
  } catch (e) {
    return null;
  }
};

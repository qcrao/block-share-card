export const queryCurrentActiveBlockUID = (blockElement, blockContainer) => {
  return {
    uid: blockElement.id.slice(-9),
    username: document
      .querySelector("[data-edit-display-name]")
      ?.getAttribute("data-edit-display-name"),
    tags: JSON.parse(blockContainer?.getAttribute("data-page-links")) || [],
  };
};

export const getBlockInfoByUID = async (
  uid,
  withChildren = false,
  withParents = false
) => {
  try {
    let q = `[:find (pull ?page
                       [:node/title :block/string :block/uid :block/heading :block/props 
                        :entity/attrs :block/open :block/text-align :children/view-type
                        :block/order :edit/time :user/display-name
                        ${withChildren ? "{:block/children ...}" : ""}
                        ${withParents ? "{:block/parents ...}" : ""}
                       ])
                    :where [?page :block/uid "${uid}"]  ]`;
    var results = await window.roamAlphaAPI.q(q);
    if (results.length == 0) return null;
    return results[0][0];
  } catch (e) {
    return null;
  }
};

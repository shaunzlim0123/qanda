import { apiCall, printErrorMessage } from "./helpers.js";

function formatTimeSince(createdAt) {
  const time = Math.floor((Date.now() - new Date(createdAt)) / 1000);
  if (time < 60) {
    return "Just now";
  } else if (time < 3600) {
    return `${Math.floor(time / 60)} minute(s) ago`;
  } else if (time < 86400) {
    return `${Math.floor(time / 3600)} hour(s) ago`;
  } else if (time < 604800) {
    return `${Math.floor(time / 86400)} day(s) ago`;
  } else {
    return `${Math.floor(time / 604800)} week(s) ago`;
  }
}

export function renderComments(threadId, container) {
  const commentList = document.createElement("div");
  commentList.id = "comment-list-container";
  container.appendChild(commentList);

  apiCall(
    `/comments?threadId=${threadId}`,
    "GET",
    null,
    localStorage.getItem("token"),
  )
    .then((comments) => {
      // Fetch all unique users in parallel
      const userIds = [...new Set(comments.map((c) => c.creatorId))];
      const userPromises = userIds.map((id) =>
        apiCall(
          `/user?userId=${id}`,
          "GET",
          null,
          localStorage.getItem("token"),
        ),
      );

      return Promise.all(userPromises).then((users) => {
        // Build userId -> userData lookup
        const userMap = {};
        userIds.forEach((id, index) => {
          userMap[id] = users[index];
        });

        // Build parent -> children map
        const childrenMap = {};
        const topLevel = [];
        comments.forEach((comment) => {
          if (comment.parentCommentId === null) {
            topLevel.push(comment);
          } else {
            if (!childrenMap[comment.parentCommentId]) {
              childrenMap[comment.parentCommentId] = [];
            }
            childrenMap[comment.parentCommentId].push(comment);
          }
        });

        // Sort reverse chronological (newest first)
        const sortByNewest = (a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt);
        topLevel.sort(sortByNewest);
      });
    })
    .catch((err) => {
      printErrorMessage(err, container);
    });
}

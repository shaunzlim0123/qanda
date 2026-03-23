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

        // Recursively render a comment and its children
        function renderComment(comment, parentEl) {
          const userData = userMap[comment.creatorId];

          const commentBox = document.createElement("article");
          commentBox.classList.add("list-comment-container");

          const profilePic = document.createElement("img");
          profilePic.classList.add("list-comment-profile");
          profilePic.src = userData.image;
          profilePic.alt = userData.name;

          const authorName = document.createElement("p");
          authorName.classList.add("list-comment-author");
          authorName.textContent = userData.name;

          const body = document.createElement("p");
          body.classList.add("list-comment-body");
          body.textContent = comment.content;

          const date = document.createElement("p");
          date.classList.add("list-comment-date");
          date.textContent = formatTimeSince(comment.createdAt);

          const likes = document.createElement("p");
          likes.classList.add("list-comment-likes");
          likes.textContent = comment.likes.length;

          commentBox.appendChild(profilePic);
          commentBox.appendChild(authorName);
          commentBox.appendChild(body);
          commentBox.appendChild(date);
          commentBox.appendChild(likes);

          parentEl.appendChild(commentBox);

          // Render nested children inside this comment
          const children = childrenMap[comment.id] || [];
          children.sort(sortByNewest);
          children.forEach((child) => {
            renderComment(child, commentBox);
          });
        }

        topLevel.forEach((comment) => {
          renderComment(comment, commentList);
        });
      });
    })
    .catch((err) => {
      printErrorMessage(err, container);
    });
}

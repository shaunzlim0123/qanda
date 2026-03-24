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

export function renderComments(threadId, container, isLocked, app) {
  const commentList = document.createElement("div");
  commentList.id = "comment-list-container";
  container.appendChild(commentList);

  const token = localStorage.getItem("token");

  apiCall(`/comments?threadId=${threadId}`, "GET", null, token)
    .then((comments) => {
      // Current user identity (for admin/creator checks)
      const currentUserId = Number(
        JSON.parse(atob(token.split(".")[1])).userId,
      );

      // Fetch all unique users in parallel (include current user for admin check)
      const userIds = [
        ...new Set([...comments.map((c) => c.creatorId), currentUserId]),
      ];
      const userPromises = userIds.map((id) =>
        apiCall(`/user?userId=${id}`, "GET", null, token),
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

          const authorName = document.createElement("button");
          authorName.classList.add("list-comment-author");
          authorName.type = "button";
          authorName.textContent = userData.name;
          authorName.addEventListener("click", () => {
            app.navigateTo("profile", comment.creatorId);
          });

          const body = document.createElement("p");
          body.classList.add("list-comment-body");
          body.textContent = comment.content;

          const date = document.createElement("p");
          date.classList.add("list-comment-date");
          date.textContent = formatTimeSince(comment.createdAt);

          const likes = document.createElement("p");
          likes.classList.add("list-comment-likes");
          likes.textContent = comment.likes.length;

          // avatar + author + date
          const header = document.createElement("div");
          header.classList.add("comment-header");
          header.appendChild(profilePic);
          header.appendChild(authorName);
          header.appendChild(date);
          commentBox.appendChild(header);

          // Body
          commentBox.appendChild(body);

          // like + count + edit + reply
          const actions = document.createElement("div");
          actions.classList.add("comment-actions");

          const likeBtn = document.createElement("button");
          likeBtn.classList.add("thread-like-button");
          likeBtn.type = "button";

          const isLiked = comment.likes.includes(currentUserId);
          likeBtn.textContent = isLiked ? "unlike" : "like";
          if (isLiked) likeBtn.classList.add("liked");

          likeBtn.addEventListener("click", () => {
            likeBtn.classList.toggle("liked");
            likeBtn.textContent = likeBtn.classList.contains("liked")
              ? "unlike"
              : "like";

            const currentCount = Number(likes.textContent);
            likes.textContent = likeBtn.classList.contains("liked")
              ? currentCount + 1
              : currentCount - 1;

            apiCall(
              "/comment/like",
              "PUT",
              { id: comment.id, turnon: likeBtn.classList.contains("liked") },
              token,
            ).catch((err) => {
              likeBtn.classList.toggle("liked");
              likeBtn.textContent = likeBtn.classList.contains("liked")
                ? "unlike"
                : "like";
              const rollbackCount = Number(likes.textContent);
              likes.textContent = likeBtn.classList.contains("liked")
                ? rollbackCount + 1
                : rollbackCount - 1;
              printErrorMessage(err, commentBox);
            });
          });
          actions.appendChild(likes);
          actions.appendChild(likeBtn);

          // Edit button (admin or comment creator only)
          const currentUserData = userMap[currentUserId];
          if (comment.creatorId === currentUserId || currentUserData.admin) {
            const editBtn = document.createElement("button");
            editBtn.classList.add("comment-edit-button");
            editBtn.type = "button";
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => {
              showEditCommentModal(comment, threadId, container, isLocked, app);
            });
            actions.appendChild(editBtn);
          }

          // Reply button (hidden when locked)
          if (!isLocked) {
            const replyBtn = document.createElement("button");
            replyBtn.classList.add("thread-reply-button");
            replyBtn.type = "button";
            replyBtn.textContent = "Reply";
            replyBtn.addEventListener("click", () => {
              showReplyModal(threadId, comment.id, container, isLocked, app);
            });
            actions.appendChild(replyBtn);
          }

          commentBox.appendChild(actions);
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

        // Comment form at the bottom (hidden when locked)
        if (!isLocked) {
          const commentText = document.createElement("textarea");
          commentText.id = "thread-comment-text";

          const submitBtn = document.createElement("button");
          submitBtn.id = "thread-comment-submit";
          submitBtn.type = "button";
          submitBtn.textContent = "Comment";

          container.appendChild(commentText);
          container.appendChild(submitBtn);

          submitBtn.addEventListener("click", () => {
            const content = commentText.value;
            apiCall(
              "/comment",
              "POST",
              { content, threadId, parentCommentId: null },
              token,
            )
              .then(() => {
                commentList.remove();
                commentText.remove();
                submitBtn.remove();
                renderComments(threadId, container, isLocked, app);
              })
              .catch((err) => {
                printErrorMessage(err, container);
              });
          });
        }
      });
    })
    .catch((err) => {
      printErrorMessage(err, container);
    });
}

function showReplyModal(threadId, parentCommentId, container, isLocked, app) {
  const token = localStorage.getItem("token");
  const backdrop = document.createElement("div");
  backdrop.classList.add("modal-backdrop");

  const modal = document.createElement("div");
  modal.id = "thread-reply-container";

  const replyText = document.createElement("textarea");
  replyText.id = "thread-reply-text";

  const submitBtn = document.createElement("button");
  submitBtn.id = "thread-reply-submit";
  submitBtn.type = "button";
  submitBtn.textContent = "Comment";

  submitBtn.addEventListener("click", () => {
    const content = replyText.value;
    apiCall("/comment", "POST", { content, threadId, parentCommentId }, token)
      .then(() => {
        backdrop.remove();
        // Remove old comment list and form, then re-render
        document.getElementById("comment-list-container").remove();
        const oldText = document.getElementById("thread-comment-text");
        if (oldText) oldText.remove();
        const oldSubmit = document.getElementById("thread-comment-submit");
        if (oldSubmit) oldSubmit.remove();
        renderComments(threadId, container, isLocked, app);
      })
      .catch((err) => {
        printErrorMessage(err, modal);
      });
  });

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "x";
  closeBtn.addEventListener("click", () => {
    backdrop.remove();
  });

  modal.appendChild(closeBtn);
  modal.appendChild(replyText);
  modal.appendChild(submitBtn);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

function showEditCommentModal(comment, threadId, container, isLocked, app) {
  const token = localStorage.getItem("token");
  const backdrop = document.createElement("div");
  backdrop.classList.add("modal-backdrop");

  const modal = document.createElement("div");
  modal.id = "thread-edit-container";

  const editText = document.createElement("textarea");
  editText.id = "thread-edit-text";
  editText.value = comment.content;

  const submitBtn = document.createElement("button");
  submitBtn.id = "thread-edit-submit";
  submitBtn.type = "button";
  submitBtn.textContent = "Comment";

  submitBtn.addEventListener("click", () => {
    const content = editText.value;
    apiCall("/comment", "PUT", { id: comment.id, content }, token)
      .then(() => {
        backdrop.remove();
        document.getElementById("comment-list-container").remove();
        const oldText = document.getElementById("thread-comment-text");
        if (oldText) oldText.remove();
        const oldSubmit = document.getElementById("thread-comment-submit");
        if (oldSubmit) oldSubmit.remove();
        renderComments(threadId, container, isLocked, app);
      })
      .catch((err) => {
        printErrorMessage(err, modal);
      });
  });

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "x";
  closeBtn.addEventListener("click", () => {
    backdrop.remove();
  });

  modal.appendChild(closeBtn);
  modal.appendChild(editText);
  modal.appendChild(submitBtn);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

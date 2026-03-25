import { createLabeledInput, apiCall, printErrorMessage } from "./helpers.js";
import { renderComments } from "./comments.js";

export function renderCreateThreadPage(app) {
  const section = document.createElement("section");

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.classList.add("card-close-btn");
  closeBtn.textContent = "x";
  closeBtn.addEventListener("click", () => {
    app.navigateTo(app.lastPage, app.lastData);
  });
  section.appendChild(closeBtn);

  const heading = document.createElement("h2");
  heading.textContent = "Create Thread";
  section.appendChild(heading);

  const form = document.createElement("form");

  const body = document.createElement("textarea");
  body.id = "create-thread-body";

  const submit = document.createElement("button");
  submit.id = "create-thread-submit";
  submit.type = "button";
  submit.textContent = "Submit";
  const token = localStorage.getItem("token");
  submit.addEventListener("click", () => {
    const title = document.getElementById("create-thread-title").value;
    const isPublic = !document.getElementById("create-thread-private").checked;
    const content = document.getElementById("create-thread-body").value;
    apiCall("/thread", "POST", { title, isPublic, content }, token)
      .then((data) => {
        app.navigateTo("thread", data.id);
      })
      .catch((err) => {
        printErrorMessage(err, section);
      });
  });

  form.appendChild(createLabeledInput("text", "create-thread-title", "Title"));
  form.appendChild(
    createLabeledInput("checkbox", "create-thread-private", "Private"),
  );
  form.appendChild(body);
  form.appendChild(submit);

  section.appendChild(form);

  app.main.appendChild(section);
}

export function renderThreadList(sidebar, app) {
  let start = 0;
  let loading = false;
  let allLoaded = false;

  const loader = document.createElement("p");
  loader.classList.add("thread-list-loader");
  loader.textContent = "Loading...";
  sidebar.appendChild(loader);

  function showLoader() {
    loader.classList.add("visible");
  }

  function hideLoader() {
    loader.classList.remove("visible");
  }

  function loadThreads() {
    if (loading || allLoaded) return;
    loading = true;
    showLoader();

    const token = localStorage.getItem("token");
    apiCall(`/threads?start=${start}`, "GET", null, token)
      .then((threadIds) => {
        const threadPromises = threadIds.map((id) =>
          apiCall(`/thread?id=${id}`, "GET", null, token),
        );
        return Promise.all(threadPromises);
      })
      .then((threads) => {
        const authorPromises = threads.map((thread) =>
          apiCall(`/user?userId=${thread.creatorId}`, "GET", null, token),
        );

        return Promise.all(authorPromises).then((authors) => {
          threads.forEach((thread, index) => {
            app.threadIDs.push(thread.id);
            const threadBox = document.createElement("article");
            threadBox.classList.add("list-thread-container");
            threadBox.dataset.threadId = thread.id;
            if (!thread.isPublic) {
              threadBox.classList.add("thread-private");
            }

            const title = document.createElement("h3");
            title.classList.add("list-thread-title");
            title.textContent = thread.title;

            const date = document.createElement("p");
            date.classList.add("list-thread-date");
            date.textContent = new Date(thread.createdAt).toLocaleDateString();

            const author = document.createElement("p");
            author.classList.add("list-thread-author");
            author.textContent = authors[index].name;

            const likes = document.createElement("p");
            likes.classList.add("list-thread-likes");
            likes.textContent = thread.likes.length;

            threadBox.appendChild(title);
            threadBox.appendChild(date);
            threadBox.appendChild(author);
            threadBox.appendChild(likes);
            threadBox.addEventListener("click", () => {
              app.navigateTo("thread", thread.id);
            });
            sidebar.insertBefore(threadBox, loader);
          });

          start += 5;

          if (threads.length < 5) {
            allLoaded = true;
            loader.remove();
          }

          loading = false;
          hideLoader();

          // If sidebar still isn't scrollable, keep loading
          if (!allLoaded && sidebar.scrollHeight <= sidebar.clientHeight) {
            loadThreads();
          }
        });
      })
      .catch((err) => {
        loading = false;
        hideLoader();
        printErrorMessage(err, sidebar);
      });
  }

  // Load initial batch
  app.threadIDs.length = 0;
  loadThreads();

  // Infinite scroll: load more when near bottom
  sidebar.addEventListener("scroll", () => {
    if (loading || allLoaded) return;
    const nearBottom =
      sidebar.scrollTop + sidebar.clientHeight >= sidebar.scrollHeight - 50;
    if (nearBottom) {
      loadThreads();
    }
  });
}

export function renderThreadContent(threadId, content, app) {
  const container = document.createElement("div");
  container.id = "thread-container";

  const token = localStorage.getItem("token");

  apiCall(`/thread?id=${threadId}`, "GET", null, token)
    .then((thread) => {
      const currentUserId = Number(
        JSON.parse(atob(token.split(".")[1])).userId,
      );

      return Promise.all([
        apiCall(`/user?userId=${thread.creatorId}`, "GET", null, token),
        apiCall(`/user?userId=${currentUserId}`, "GET", null, token),
      ])
        .then(([userData, currentUserData]) => {
          const title = document.createElement("h2");
          title.id = "thread-title";
          title.textContent = thread.title;

          const author = document.createElement("button");
          author.id = "thread-author";
          author.type = "button";
          author.textContent = userData.name;
          author.addEventListener("click", () => {
            app.navigateTo("profile", thread.creatorId);
          });

          const body = document.createElement("p");
          body.id = "thread-body";
          body.textContent = thread.content;

          container.appendChild(title);
          container.appendChild(author);
          container.appendChild(body);

          const isCreator = thread.creatorId === currentUserId;

          // Edit button visible for creator/admin regardless of lock
          if (isCreator || currentUserData.admin) {
            const editBtn = document.createElement("button");
            editBtn.id = "thread-edit-button";
            editBtn.type = "button";
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => {
              showEditThreadModal(threadId, app);
            });
            container.appendChild(editBtn);
          }

          // Like button hidden when thread is locked
          if (!thread.lock) {
            const likeBtn = document.createElement("button");
            likeBtn.id = "thread-like-toggle";
            likeBtn.type = "button";

            const likesCount = document.createElement("span");
            likesCount.id = "thread-likes";
            likesCount.textContent = thread.likes.length;
            likeBtn.appendChild(likesCount);

            const isLiked = thread.likes.includes(Number(currentUserId));
            if (isLiked) likeBtn.classList.add("liked");

            likeBtn.addEventListener("click", () => {
              likeBtn.classList.toggle("liked");

              // increment/decrement the like count UI
              const currentCount = Number(likesCount.textContent);
              const newCount = likeBtn.classList.contains("liked")
                ? currentCount + 1
                : currentCount - 1;
              likesCount.textContent = newCount;

              // Update sidebar threads to reflect the like update
              const sidebarLikes = document.querySelector(
                `.list-thread-container[data-thread-id="${threadId}"] .list-thread-likes`,
              );
              if (sidebarLikes) sidebarLikes.textContent = newCount;

              apiCall(
                "/thread/like",
                "PUT",
                {
                  id: threadId,
                  turnon: likeBtn.classList.contains("liked"),
                },
                token,
              ).catch((err) => {
                likeBtn.classList.toggle("liked");

                // rollback the like count UI
                const rollbackCount = Number(likesCount.textContent);
                const rolledBack = likeBtn.classList.contains("liked")
                  ? rollbackCount + 1
                  : rollbackCount - 1;
                likesCount.textContent = rolledBack;

                // Update sidebar threads to reflect the like update
                const sidebarLikes = document.querySelector(
                  `.list-thread-container[data-thread-id="${threadId}"] .list-thread-likes`,
                );
                if (sidebarLikes) sidebarLikes.textContent = rolledBack;
                printErrorMessage(err, container);
              });
            });
            container.appendChild(likeBtn);
          }

          // Actions always visible: delete, watch
          if (isCreator || currentUserData.admin) {
            const deleteBtn = document.createElement("button");
            deleteBtn.id = "thread-delete-button";
            deleteBtn.type = "button";
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", () => {
              apiCall("/thread", "DELETE", { id: threadId }, token).then(() => {
                const index = app.threadIDs.indexOf(threadId);
                if (index !== -1) app.threadIDs.splice(index, 1);
                app.contentArea = null;
                if (app.threadIDs.length > 0) {
                  app.navigateTo("thread", app.threadIDs[0]);
                } else {
                  app.navigateTo("dashboard");
                }
              });
            });
            container.appendChild(deleteBtn);
          }

          const watchBtn = document.createElement("button");
          watchBtn.id = "thread-watch-toggle";
          watchBtn.type = "button";

          const isWatching = thread.watchees.includes(Number(currentUserId));
          watchBtn.textContent = isWatching ? "Unwatch" : "Watch";
          if (isWatching) watchBtn.classList.add("watching");

          watchBtn.addEventListener("click", () => {
            watchBtn.classList.toggle("watching");
            watchBtn.textContent = watchBtn.classList.contains("watching")
              ? "Unwatch"
              : "Watch";

            apiCall(
              "/thread/watch",
              "PUT",
              {
                id: threadId,
                turnon: watchBtn.classList.contains("watching"),
              },
              token,
            ).catch((err) => {
              watchBtn.classList.toggle("watching");
              watchBtn.textContent = watchBtn.classList.contains("watching")
                ? "Unwatch"
                : "Watch";
              printErrorMessage(err, container);
            });
          });
          container.appendChild(watchBtn);

          // Render comments section
          renderComments(threadId, container, thread.lock, app);

          // poll for live updates
          if (app.pollInterval) clearInterval(app.pollInterval);
          let lastCommentCount = null;

          app.pollInterval = setInterval(() => {
            apiCall(`/thread?id=${threadId}`, "GET", null, token).then(
              (latest) => {
                const likeBtn = document.getElementById("thread-like-toggle");
                if (likeBtn) {
                  if (latest.likes.includes(currentUserId)) {
                    likeBtn.classList.add("liked");
                  } else {
                    likeBtn.classList.remove("liked");
                  }
                }
                const likesEl = document.getElementById("thread-likes");
                if (likesEl) likesEl.textContent = latest.likes.length;
                const sidebarLikes = document.querySelector(
                  `.list-thread-container[data-thread-id="${threadId}"] .list-thread-likes`,
                );
                if (sidebarLikes) {
                  sidebarLikes.textContent = latest.likes.length;
                }
              },
            );

            apiCall(`/comments?threadId=${threadId}`, "GET", null, token)
              .then((comments) => {
                if (lastCommentCount === null) {
                  lastCommentCount = comments.length;
                  return;
                }
                if (comments.length !== lastCommentCount) {
                  lastCommentCount = comments.length;
                  // save what the user was typing before re-render
                  const textArea = document.getElementById(
                    "thread-comment-text",
                  );
                  const savedText = textArea ? textArea.value : "";

                  const commentList = document.getElementById(
                    "comment-list-container",
                  );
                  if (commentList) commentList.remove();
                  if (textArea) textArea.remove();
                  const oldSubmit = document.getElementById(
                    "thread-comment-submit",
                  );
                  if (oldSubmit) oldSubmit.remove();

                  renderComments(threadId, container, thread.lock, app);

                  setTimeout(() => {
                    const newArea = document.getElementById(
                      "thread-comment-text",
                    );
                    if (newArea && savedText) newArea.value = savedText;
                  }, 100);
                }
              })
              .catch(() => {});
          }, 2000);
        })
        .catch((err) => {
          printErrorMessage(err, container);
        });
    })
    .catch((err) => {
      printErrorMessage(err, content);
    });

  content.appendChild(container);
}

function showEditThreadModal(threadId, app) {
  const token = localStorage.getItem("token");
  const backdrop = document.createElement("div");
  backdrop.classList.add("modal-backdrop");

  const modal = document.createElement("div");
  modal.id = "edit-thread-container";

  const heading = document.createElement("h2");
  heading.textContent = "Edit Thread";
  modal.appendChild(heading);

  const form = document.createElement("form");
  form.appendChild(createLabeledInput("text", "edit-thread-title", "Title"));

  const bodyTextarea = document.createElement("textarea");
  bodyTextarea.id = "edit-thread-body";
  form.appendChild(bodyTextarea);

  form.appendChild(
    createLabeledInput("checkbox", "edit-thread-private", "Private"),
  );
  form.appendChild(
    createLabeledInput("checkbox", "edit-thread-locked", "Locked"),
  );

  const submitBtn = document.createElement("button");
  submitBtn.id = "edit-thread-submit";
  submitBtn.type = "button";
  submitBtn.textContent = "Save";
  submitBtn.addEventListener("click", () => {
    const title = document.getElementById("edit-thread-title").value;
    const isPublic = !document.getElementById("edit-thread-private").checked;
    const content = document.getElementById("edit-thread-body").value;
    const lock = document.getElementById("edit-thread-locked").checked;

    apiCall(
      "/thread",
      "PUT",
      { id: threadId, title, isPublic, content, lock },
      token,
    )
      .then(() => {
        const sidebarItem = document.querySelector(
          `.list-thread-container[data-thread-id="${threadId}"]`,
        );
        if (sidebarItem) {
          if (isPublic) {
            sidebarItem.classList.remove("thread-private");
          } else {
            sidebarItem.classList.add("thread-private");
          }
          const sidebarTitle = sidebarItem.querySelector(".list-thread-title");
          if (sidebarTitle) sidebarTitle.textContent = title;
        }
        backdrop.remove();
        app.navigateTo("thread", threadId);
      })
      .catch((err) => {
        printErrorMessage(err, modal);
      });
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => {
    backdrop.remove();
  });

  form.appendChild(submitBtn);
  form.appendChild(cancelBtn);
  modal.appendChild(form);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Pre-populate fields from current thread data
  apiCall(`/thread?id=${threadId}`, "GET", null, token)
    .then((thread) => {
      document.getElementById("edit-thread-title").value = thread.title;
      document.getElementById("edit-thread-body").value = thread.content;
      document.getElementById("edit-thread-private").checked = !thread.isPublic;
      document.getElementById("edit-thread-locked").checked = thread.lock;
    })
    .catch((err) => {
      printErrorMessage(err, modal);
    });
}

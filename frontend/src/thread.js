import { createLabeledInput, apiCall, printErrorMessage } from "./helpers.js";

export function renderCreateThreadPage(app) {
  const section = document.createElement("section");

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

  form.appendChild(createLabeledInput("text", "create-thread-title", "Title"));
  form.appendChild(
    createLabeledInput("checkbox", "create-thread-private", "Private Checkbox"),
  );
  form.appendChild(body);
  form.appendChild(submit);

  section.appendChild(form);

  app.main.appendChild(section);

  // User Interaction
  document
    .getElementById("create-thread-submit")
    .addEventListener("click", () => {
      const title = document.getElementById("create-thread-title").value;
      const isPublic = !document.getElementById("create-thread-private")
        .checked;
      const content = document.getElementById("create-thread-body").value;
      apiCall(
        "/thread",
        "POST",
        { title, isPublic, content },
        localStorage.getItem("token"),
      )
        .then((data) => {
          app.navigateTo("thread", data.id);
        })
        .catch((err) => {
          printErrorMessage(err, section);
        });
    });
}

export function renderThreadList(sidebar, app) {
  let start = 0;

  const moreBtn = document.createElement("button");
  moreBtn.id = "list-more-button";
  moreBtn.type = "button";
  moreBtn.textContent = "More";
  sidebar.appendChild(moreBtn);

  function loadThreads() {
    apiCall(
      `/threads?start=${start}`,
      "GET",
      null,
      localStorage.getItem("token"),
    )
      .then((threadIds) => {
        const threadPromises = threadIds.map((id) =>
          apiCall(
            `/thread?id=${id}`,
            "GET",
            null,
            localStorage.getItem("token"),
          ),
        );
        return Promise.all(threadPromises);
      })
      .then((threads) => {
        const authorPromises = threads.map((thread) =>
          apiCall(
            `/user?userId=${thread.creatorId}`,
            "GET",
            null,
            localStorage.getItem("token"),
          ),
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
            sidebar.insertBefore(threadBox, moreBtn);
          });

          start += 5;

          if (threads.length < 5) {
            moreBtn.remove();
          }
        });
      })
      .catch((err) => {
        printErrorMessage(err, sidebar);
      });
  }

  // Load initial batch
  app.threadIDs.length = 0;
  loadThreads();

  // Load more on button click
  moreBtn.addEventListener("click", loadThreads);
}

export function renderThreadContent(threadId, content, app) {
  const container = document.createElement("div");
  container.id = "thread-container";

  apiCall(`/thread?id=${threadId}`, "GET", null, localStorage.getItem("token"))
    .then((thread) => {
      return apiCall(
        `/user?userId=${thread.creatorId}`,
        "GET",
        null,
        localStorage.getItem("token"),
      )
        .then((userData) => {
          const title = document.createElement("h2");
          title.id = "thread-title";
          title.textContent = thread.title;

          const author = document.createElement("p");
          author.id = "thread-author";
          author.textContent = userData.name;

          const body = document.createElement("p");
          body.id = "thread-body";
          body.textContent = thread.content;

          const likes = document.createElement("p");
          likes.id = "thread-likes";
          likes.textContent = thread.likes.length;

          container.appendChild(title);
          container.appendChild(author);
          container.appendChild(body);
          container.appendChild(likes);

          // Current user identity
          const token = localStorage.getItem("token");
          const currentUserId = JSON.parse(atob(token.split(".")[1])).userId;
          const isCreator = thread.creatorId === Number(currentUserId);

          // Actions hidden when thread is locked: edit, like
          if (!thread.lock) {
            if (isCreator || userData.admin) {
              const editBtn = document.createElement("button");
              editBtn.id = "thread-edit-button";
              editBtn.type = "button";
              editBtn.textContent = "Edit";
              editBtn.addEventListener("click", () => {
                showEditThreadModal(threadId, app);
              });
              container.appendChild(editBtn);
            }

            const likeBtn = document.createElement("button");
            likeBtn.id = "thread-like-toggle";
            likeBtn.type = "button";

            const isLiked = thread.likes.includes(Number(currentUserId));
            likeBtn.textContent = isLiked ? "♥" : "♡";
            if (isLiked) likeBtn.classList.add("liked");

            likeBtn.addEventListener("click", () => {
              likeBtn.classList.toggle("liked");
              likeBtn.textContent = likeBtn.classList.contains("liked")
                ? "♥"
                : "♡";

              // increment/decrement the like count UI
              const currentCount = Number(likes.textContent);
              likes.textContent = likeBtn.classList.contains("liked")
                ? currentCount + 1
                : currentCount - 1;

              // Update sidebar threads to reflect the like update
              const sidebarLikes = document.querySelector(
                `.list-thread-container[data-thread-id="${threadId}"] .list-thread-likes`,
              );
              if (sidebarLikes) sidebarLikes.textContent = likes.textContent;

              apiCall(
                "/thread/like",
                "PUT",
                {
                  id: threadId,
                  turnon: likeBtn.classList.contains("liked"),
                },
                localStorage.getItem("token"),
              ).catch((err) => {
                likeBtn.classList.toggle("liked");
                likeBtn.textContent = likeBtn.classList.contains("liked")
                  ? "♥"
                  : "♡";

                // increment/decrement the like count UI
                const currentCount = Number(likes.textContent);
                likes.textContent = likeBtn.classList.contains("liked")
                  ? currentCount + 1
                  : currentCount - 1;

                // Update sidebar threads to reflect the like update
                const sidebarLikes = document.querySelector(
                  `.list-thread-container[data-thread-id="${threadId}"] .list-thread-likes`,
                );
                if (sidebarLikes) sidebarLikes.textContent = likes.textContent;
                printErrorMessage(err, container);
              });
            });
            container.appendChild(likeBtn);
          }

          // Actions always visible: delete, watch
          if (isCreator || userData.admin) {
            const deleteBtn = document.createElement("button");
            deleteBtn.id = "thread-delete-button";
            deleteBtn.type = "button";
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", () => {
              apiCall(
                "/thread",
                "DELETE",
                { id: threadId },
                localStorage.getItem("token"),
              ).then(() => {
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
              localStorage.getItem("token"),
            ).catch((err) => {
              watchBtn.classList.toggle("watching");
              watchBtn.textContent = watchBtn.classList.contains("watching")
                ? "Unwatch"
                : "Watch";
              printErrorMessage(err, container);
            });
          });
          container.appendChild(watchBtn);
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
  apiCall(`/thread?id=${threadId}`, "GET", null, localStorage.getItem("token"))
    .then((thread) => {
      document.getElementById("edit-thread-title").value = thread.title;
      document.getElementById("edit-thread-body").value = thread.content;
      document.getElementById("edit-thread-private").checked = !thread.isPublic;
      document.getElementById("edit-thread-locked").checked = thread.lock;
    })
    .catch((err) => {
      printErrorMessage(err, modal);
    });

  // User Interaction
  document
    .getElementById("edit-thread-submit")
    .addEventListener("click", () => {
      const title = document.getElementById("edit-thread-title").value;
      const isPublic = !document.getElementById("edit-thread-private").checked;
      const content = document.getElementById("edit-thread-body").value;
      const lock = document.getElementById("edit-thread-locked").checked;

      apiCall(
        "/thread",
        "PUT",
        { id: threadId, title, isPublic, content, lock },
        localStorage.getItem("token"),
      )
        .then(() => {
          backdrop.remove();
          app.navigateTo("thread", threadId);
        })
        .catch((err) => {
          printErrorMessage(err, modal);
        });
    });
}

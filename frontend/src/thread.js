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

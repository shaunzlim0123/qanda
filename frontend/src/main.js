import { createLabeledInput, apiCall, printErrorMessage } from "./helpers.js";

const main = document.querySelector("main");

// Clears the main content area
function clearMain() {
  while (main.firstChild) {
    main.removeChild(main.firstChild);
  }
}

// Track whether authenticated layout is already rendered
let contentArea = null;

// Navigation: call the appropriate page function
function navigateTo(page, data) {
  // If layout exists and navigating between authenticated pages, only swap content
  if (
    contentArea &&
    page !== "login" &&
    page !== "register" &&
    page !== "create-thread"
  ) {
    clearContent();
    if (page === "dashboard") {
      renderDashboardContent(contentArea);
    } else if (page === "thread") {
      renderThreadContent(data, contentArea);
    }
    return;
  }

  // Otherwise rebuild everything
  clearMain();
  contentArea = null;
  if (page === "login") {
    renderLoginPage();
  } else if (page === "register") {
    renderRegisterPage();
  } else if (page === "create-thread") {
    renderCreateThreadPage();
  } else {
    renderAuthenticatedLayout(page, data);
  }
}

function clearContent() {
  while (contentArea.firstChild) {
    contentArea.removeChild(contentArea.firstChild);
  }
}

function renderLoginPage() {
  // Initial page rendering
  const section = document.createElement("section");

  const heading = document.createElement("h2");
  heading.textContent = "Login";
  section.appendChild(heading);

  const form = document.createElement("form");
  form.classList.add("login-form");

  form.appendChild(createLabeledInput("text", "login-email", "Email"));
  form.appendChild(
    createLabeledInput("password", "login-password", "Password"),
  );

  const button = document.createElement("button");
  button.id = "login-submit";
  button.type = "button";
  button.textContent = "Login";
  form.appendChild(button);

  section.appendChild(form);

  const nav = document.createElement("nav");
  const link = document.createElement("a");
  link.id = "register-link";
  link.textContent = "Don't have an account? Register";
  link.href = "#";
  nav.appendChild(link);
  section.appendChild(nav);

  main.appendChild(section);

  // User Interaction
  document.getElementById("login-submit").addEventListener("click", () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    apiCall("/auth/login", "POST", { email, password })
      .then((data) => {
        localStorage.setItem("token", data.token);
        navigateTo("dashboard");
      })
      .catch((err) => {
        printErrorMessage(err, section);
      });
  });

  document.getElementById("register-link").addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("register");
  });
}

function renderRegisterPage() {
  // Initial page rendering
  const section = document.createElement("section");

  const heading = document.createElement("h2");
  heading.textContent = "Register";
  section.appendChild(heading);

  const form = document.createElement("form");
  form.classList.add("register-form");

  form.appendChild(createLabeledInput("text", "register-email", "Email"));
  form.appendChild(createLabeledInput("text", "register-name", "Name"));
  form.appendChild(
    createLabeledInput("password", "register-password", "Password"),
  );
  form.appendChild(
    createLabeledInput(
      "password",
      "register-confirm-password",
      "Confirm Password",
    ),
  );

  const button = document.createElement("button");
  button.id = "register-submit";
  button.type = "button";
  button.textContent = "Register";
  form.appendChild(button);

  section.appendChild(form);

  const nav = document.createElement("nav");
  const link = document.createElement("a");
  link.id = "login-link";
  link.textContent = "Already have an account? Login";
  link.href = "#";
  nav.appendChild(link);
  section.appendChild(nav);

  main.appendChild(section);

  // User Interaction
  document.getElementById("login-link").addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("login");
  });

  document.getElementById("register-submit").addEventListener("click", () => {
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById(
      "register-confirm-password",
    ).value;

    if (password !== confirmPassword) {
      printErrorMessage("Passwords do not match.", section);
      return;
    }

    const email = document.getElementById("register-email").value;
    const name = document.getElementById("register-name").value;
    apiCall("/auth/register", "POST", { email, password, name })
      .then((data) => {
        localStorage.setItem("token", data.token);
        navigateTo("dashboard");
      })
      .catch((err) => {
        printErrorMessage(err, section);
      });
  });
}

// Shared layout for all authenticated pages
function renderAuthenticatedLayout(page, data) {
  const wrapper = document.createElement("div");
  wrapper.id = "dashboard-container";

  // Header with persistent buttons
  const header = document.createElement("header");

  const createBtn = document.createElement("button");
  createBtn.id = "create-thread-button";
  createBtn.type = "button";
  createBtn.textContent = "Create";
  header.appendChild(createBtn);

  const logoutBtn = document.createElement("button");
  logoutBtn.id = "logout-button";
  logoutBtn.type = "button";
  logoutBtn.textContent = "Logout";
  header.appendChild(logoutBtn);

  wrapper.appendChild(header);

  // Main body: sidebar + content
  const body = document.createElement("div");
  body.classList.add("layout-body");

  // Sidebar: thread list
  const sidebar = document.createElement("aside");
  sidebar.id = "thread-list-container";
  renderThreadList(sidebar);
  body.appendChild(sidebar);

  // Content area: changes per page
  contentArea = document.createElement("section");
  contentArea.classList.add("content-area");
  const content = contentArea;

  if (page === "dashboard") {
    renderDashboardContent(content);
  } else if (page === "thread") {
    renderThreadContent(data, content);
  }

  body.appendChild(content);

  wrapper.appendChild(body);
  main.appendChild(wrapper);

  // Shared event listeners
  document
    .getElementById("create-thread-button")
    .addEventListener("click", () => {
      navigateTo("create-thread");
    });

  document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem("token");
    navigateTo("login");
  });
}

// Dashboard content (blank when first logged in)
function renderDashboardContent(content) {
  const heading = document.createElement("h2");
  heading.textContent = "Dashboard";
  content.appendChild(heading);
}

// Create thread - full page (excluding header)
function renderCreateThreadPage() {
  // Full-width form section
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

  main.appendChild(section);

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
          navigateTo("thread", data.id);
        })
        .catch((err) => {
          printErrorMessage(err, section);
        });
    });
}

function renderThreadList(sidebar) {
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
        // Fetch full thread details for each ID
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
        // Fetch all authors in parallel
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
            const threadBox = document.createElement("article");
            threadBox.classList.add("list-thread-container");
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
              navigateTo("thread", thread.id);
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
  loadThreads();

  // Load more on button click
  moreBtn.addEventListener("click", loadThreads);
}

function renderThreadContent(threadId, content) {
  const container = document.createElement("div");
  container.id = "thread-container";

  apiCall(`/thread?id=${threadId}`, "GET", null, localStorage.getItem("token"))
    .then((thread) => {
      return apiCall(
        `/user?userId=${thread.creatorId}`,
        "GET",
        null,
        localStorage.getItem("token"),
      ).then((userData) => {
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
      });
    })
    .catch((err) => {
      printErrorMessage(err, content);
    });

  content.appendChild(container);
}

// Start the app on the login page, if already logged in go to dashboard page
if (localStorage.getItem("token")) {
  navigateTo("dashboard");
} else {
  navigateTo("login");
}

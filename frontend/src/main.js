import { createLabeledInput, apiCall, printErrorMessage } from "./helpers.js";

const main = document.querySelector("main");

// Clears the main content area
function clearMain() {
  while (main.firstChild) {
    main.removeChild(main.firstChild);
  }
}

// Navigation: call the appropriate page function
function navigateTo(page) {
  clearMain();
  if (page === "login") {
    renderLoginPage();
  } else if (page === "register") {
    renderRegisterPage();
  } else {
    renderAuthenticatedLayout(page);
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
function renderAuthenticatedLayout(page) {
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
  body.appendChild(sidebar);

  // Content area: changes per page
  const content = document.createElement("section");
  content.classList.add("content-area");

  if (page === "dashboard") {
    renderDashboardContent(content);
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

// Dashboard content (blank for now per milestone 1)
function renderDashboardContent(content) {
  const heading = document.createElement("h2");
  heading.textContent = "Dashboard";
  content.appendChild(heading);
}

// Start the app on the login page, if already logged in go to dashboard page
if (localStorage.getItem("token")) {
  navigateTo("dashboard");
} else {
  navigateTo("login");
}

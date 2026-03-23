import { renderLoginPage, renderRegisterPage } from "./auth.js";
import {
  renderCreateThreadPage,
  renderThreadList,
  renderThreadContent,
} from "./thread.js";

// Shared app state
const app = {
  main: document.querySelector("main"),
  contentArea: null,
  threadIDs: [],
  navigateTo: null,
};

function clearMain() {
  while (app.main.firstChild) {
    app.main.removeChild(app.main.firstChild);
  }
}

function clearContent() {
  while (app.contentArea.firstChild) {
    app.contentArea.removeChild(app.contentArea.firstChild);
  }
}

// Navigation: call the appropriate page function
function navigateTo(page, data) {
  if (
    app.contentArea &&
    page !== "login" &&
    page !== "register" &&
    page !== "create-thread"
  ) {
    clearContent();
    if (page === "dashboard") {
      renderDashboardContent(app.contentArea);
    } else if (page === "thread") {
      renderThreadContent(data, app.contentArea, app);
    }
    return;
  }

  clearMain();
  app.contentArea = null;
  if (page === "login") {
    renderLoginPage(app);
  } else if (page === "register") {
    renderRegisterPage(app);
  } else if (page === "create-thread") {
    renderCreateThreadPage(app);
  } else {
    renderAuthenticatedLayout(page, data);
  }
}
app.navigateTo = navigateTo;

// Shared layout for all authenticated pages
function renderAuthenticatedLayout(page, data) {
  const wrapper = document.createElement("div");
  wrapper.id = "dashboard-container";

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

  const body = document.createElement("div");
  body.classList.add("layout-body");

  const sidebar = document.createElement("aside");
  sidebar.id = "thread-list-container";
  renderThreadList(sidebar, app);
  body.appendChild(sidebar);

  app.contentArea = document.createElement("section");
  app.contentArea.classList.add("content-area");

  if (page === "dashboard") {
    renderDashboardContent(app.contentArea);
  } else if (page === "thread") {
    renderThreadContent(data, app.contentArea, app);
  }

  body.appendChild(app.contentArea);

  wrapper.appendChild(body);
  app.main.appendChild(wrapper);

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

function renderDashboardContent(content) {
  const heading = document.createElement("h2");
  heading.textContent = "Dashboard";
  content.appendChild(heading);
}

// Bootstrap
if (localStorage.getItem("token")) {
  navigateTo("dashboard");
} else {
  navigateTo("login");
}

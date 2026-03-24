import { renderLoginPage, renderRegisterPage } from "./auth.js";
import {
  renderCreateThreadPage,
  renderThreadList,
  renderThreadContent,
} from "./thread.js";
import { renderProfileContent } from "./user.js";

// Shared app state
const app = {
  main: document.querySelector("main"),
  contentArea: null,
  threadIDs: [],
  navigateTo: null,
  lastPage: "dashboard",
  lastData: null,
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

function renderContentPage(page, data) {
  if (page === "dashboard") {
    renderDashboardContent(app.contentArea);
  } else if (page === "thread") {
    renderThreadContent(data, app.contentArea, app);
  } else if (page === "profile") {
    renderProfileContent(data, app.contentArea, app);
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
    app.lastPage = page;
    app.lastData = data;
    clearContent();
    renderContentPage(page, data);
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
    app.lastPage = page;
    app.lastData = data;
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
  createBtn.addEventListener("click", () => {
    navigateTo("create-thread");
  });
  header.appendChild(createBtn);

  const myProfile = document.createElement("button");
  myProfile.id = "avatar-label";
  myProfile.type = "button";
  myProfile.textContent = "My Profile";
  myProfile.addEventListener("click", () => {
    const token = localStorage.getItem("token");
    const currentUserId = Number(JSON.parse(atob(token.split(".")[1])).userId);
    navigateTo("profile", currentUserId);
  });
  header.appendChild(myProfile);

  const logoutBtn = document.createElement("button");
  logoutBtn.id = "logout-button";
  logoutBtn.type = "button";
  logoutBtn.textContent = "Logout";
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    navigateTo("login");
  });
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

  renderContentPage(page, data);

  body.appendChild(app.contentArea);

  wrapper.appendChild(body);
  app.main.appendChild(wrapper);
}

function renderDashboardContent(content) {
  const placeholder = document.createElement("div");
  placeholder.classList.add("dashboard-placeholder");

  const msg = document.createElement("p");
  msg.textContent = "Select a thread";
  placeholder.appendChild(msg);

  content.appendChild(placeholder);
}

// Bootstrap
if (localStorage.getItem("token")) {
  navigateTo("dashboard");
} else {
  navigateTo("login");
}

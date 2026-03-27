import { renderLoginPage, renderRegisterPage } from "./auth.js";
import {
  renderCreateThreadPage,
  renderThreadList,
  renderThreadContent,
} from "./thread.js";
import { renderProfileContent } from "./user.js";
import {
  startNotificationPolling,
  stopNotificationPolling,
} from "./notifications.js";
import { updateHash, parseHash, getCurrentUserId } from "./helpers.js";

function toggleTheme() {
  const current = document.documentElement.dataset.theme || "light";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
}

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      document.documentElement.dataset.theme = e.matches ? "dark" : "light";
    }
  });

// app state shared across pages
const app = {
  main: document.querySelector("main"),
  contentArea: null,
  threadIDs: [],
  navigateTo: null,
  lastPage: "dashboard",
  lastData: null,
  pollInterval: null,
};

function clearMain() {
  if (app.pollInterval) {
    clearInterval(app.pollInterval);
    app.pollInterval = null;
  }
  stopNotificationPolling(app);
  while (app.main.firstChild) {
    app.main.removeChild(app.main.firstChild);
  }
}

function clearContent() {
  if (app.pollInterval) {
    clearInterval(app.pollInterval);
    app.pollInterval = null;
  }
  while (app.contentArea.firstChild) {
    app.contentArea.removeChild(app.contentArea.firstChild);
  }
}

function isMobile() {
  return window.matchMedia("(max-width: 480px)").matches;
}

function updateMobileView(page) {
  const wrapper = document.getElementById("dashboard-container");
  if (!wrapper) return;
  if (isMobile() && page !== "dashboard") {
    wrapper.classList.add("viewing-content");
  } else {
    wrapper.classList.remove("viewing-content");
  }
}

function renderContentPage(page, data) {
  updateMobileView(page);
  if (page === "dashboard") {
    renderDashboardContent(app.contentArea);
  } else if (page === "thread") {
    renderThreadContent(data, app.contentArea, app);
  } else if (page === "profile") {
    renderProfileContent(data, app.contentArea, app);
  }
}

function navigateTo(page, data) {
  if (page === "thread" || page === "profile") {
    updateHash(page, data);
  }

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

window.addEventListener("hashchange", () => {
  const parsed = parseHash();
  if (parsed) navigateTo(parsed.page, parsed.data);
});

function renderAuthenticatedLayout(page, data) {
  const wrapper = document.createElement("div");
  wrapper.id = "dashboard-container";

  const header = document.createElement("header");

  const headerLeft = document.createElement("div");
  headerLeft.classList.add("header-left");

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.classList.add("mobile-back-button");
  backBtn.textContent = "\u2190 Back";
  backBtn.addEventListener("click", () => {
    navigateTo("dashboard");
  });
  headerLeft.appendChild(backBtn);

  const brand = document.createElement("button");
  brand.classList.add("brand-text");
  brand.textContent = "Qanda";
  brand.addEventListener("click", () => {
    navigateTo("dashboard");
  });
  headerLeft.appendChild(brand);

  const createBtn = document.createElement("button");
  createBtn.id = "create-thread-button";
  createBtn.type = "button";
  createBtn.textContent = "Create";
  createBtn.addEventListener("click", () => {
    navigateTo("create-thread");
  });
  headerLeft.appendChild(createBtn);

  header.appendChild(headerLeft);

  const myProfile = document.createElement("button");
  myProfile.id = "avatar-label";
  myProfile.type = "button";
  myProfile.textContent = "My Profile";
  myProfile.addEventListener("click", () => {
    const token = localStorage.getItem("token");
    navigateTo("profile", getCurrentUserId(token));
  });
  const themeBtn = document.createElement("button");
  themeBtn.id = "theme-toggle";
  themeBtn.type = "button";
  themeBtn.addEventListener("click", toggleTheme);
  header.appendChild(themeBtn);

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

  startNotificationPolling(app);
}

function renderDashboardContent(content) {
  const placeholder = document.createElement("div");
  placeholder.classList.add("dashboard-placeholder");

  const msg = document.createElement("p");
  msg.textContent = "Select Thread";
  placeholder.appendChild(msg);

  content.appendChild(placeholder);
}

// Bootstrap — check URL hash first, then fall back to defaults
if (localStorage.getItem("token")) {
  const hashRoute = parseHash();
  if (hashRoute) {
    navigateTo(hashRoute.page, hashRoute.data);
  } else if (!navigator.onLine && localStorage.getItem("cachedThread")) {
    const cached = JSON.parse(localStorage.getItem("cachedThread"));
    navigateTo("thread", cached.threadId);
  } else {
    navigateTo("dashboard");
  }
} else {
  navigateTo("login");
}

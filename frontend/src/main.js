import { BACKEND_PORT } from "./config.js";
import {
  fileToDataUrl,
  createLabeledInput,
  apiCall,
  printErrorMessage,
} from "./helpers.js";

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
  } else if (page === "dashboard") {
    renderDashboardPage();
  }
}

function renderLoginPage() {
  // Initial page rendering
  const form = document.createElement("div");
  form.classList.add("login-form");

  form.appendChild(createLabeledInput("text", "login-email", "Email"));
  form.appendChild(
    createLabeledInput("password", "login-password", "Password"),
  );

  const button = document.createElement("button");
  button.id = "login-submit";
  button.textContent = "Login";
  form.appendChild(button);

  const link = document.createElement("a");
  link.id = "register-link";
  link.textContent = "Don't have an account? Register";
  link.href = "#";
  form.appendChild(link);

  main.appendChild(form);

  // User Interaction
  document
    .getElementById("login-submit")
    .addEventListener("click", async () => {
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      try {
        const data = await apiCall("/auth/login", "POST", { email, password });
        localStorage.setItem("token", data.token);
        navigateTo("dashboard");
      } catch (err) {
        printErrorMessage(err.message, form);
      }
    });

  document.getElementById("register-link").addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("register");
  });
}

function renderRegisterPage() {
  // Initial page rendering
  const form = document.createElement("div");
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
  button.textContent = "Register";
  form.appendChild(button);

  main.appendChild(form);

  // User Interaction
  document
    .getElementById("register-submit")
    .addEventListener("click", async () => {
      const password = document.getElementById("register-password").value;
      const confirmPassword = document.getElementById(
        "register-confirm-password",
      ).value;

      if (password !== confirmPassword) {
        printErrorMessage("Passwords do not match.", form);
        return;
      }

      const email = document.getElementById("register-email").value;
      const name = document.getElementById("register-name").value;
      try {
        const data = await apiCall("/auth/register", "POST", {
          email,
          password,
          name,
        });
        localStorage.setItem("token", data.token);
        navigateTo("dashboard");
      } catch (err) {
        printErrorMessage(err.message, form);
      }
    });
}

// Start the app on the login page, if already logged in go to dashboard page
if (localStorage.getItem("token")) {
  navigateTo("dashboard");
} else {
  navigateTo("login");
}

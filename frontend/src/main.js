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
  }
}

function renderLoginPage() {
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

  document
    .getElementById("login-submit")
    .addEventListener("click", async () => {
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      try {
        const data = await apiCall("/auth/login", "POST", { email, password });
        console.log(data);
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
}

// Start the app on the login page
navigateTo("login");

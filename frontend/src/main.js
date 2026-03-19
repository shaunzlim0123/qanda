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

// Start the app on the login page, if already logged in go to dashboard page
if (localStorage.getItem("token")) {
  navigateTo("dashboard");
} else {
  navigateTo("login");
}

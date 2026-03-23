import { createLabeledInput, apiCall, printErrorMessage } from "./helpers.js";

export function renderLoginPage(app) {
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

  app.main.appendChild(section);

  // User Interaction
  document.getElementById("login-submit").addEventListener("click", () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    apiCall("/auth/login", "POST", { email, password })
      .then((data) => {
        localStorage.setItem("token", data.token);
        app.navigateTo("dashboard");
      })
      .catch((err) => {
        printErrorMessage(err, section);
      });
  });

  document.getElementById("register-link").addEventListener("click", (e) => {
    e.preventDefault();
    app.navigateTo("register");
  });
}

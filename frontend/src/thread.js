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

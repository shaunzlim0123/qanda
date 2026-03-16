import { BACKEND_PORT } from "./config.js";
/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 *
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
  const validFileTypes = ["image/jpeg", "image/png", "image/jpg"];
  const valid = validFileTypes.find((type) => type === file.type);
  // Bad data, let's walk away.
  if (!valid) {
    throw Error("provided file is not a png, jpg or jpeg image.");
  }

  const reader = new FileReader();
  const dataUrlPromise = new Promise((resolve, reject) => {
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
  });
  reader.readAsDataURL(file);
  return dataUrlPromise;
}

// API CALL helper function
export async function apiCall(path, method, body, token) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const options = { method, headers };
  if (method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(
    `http://localhost:${BACKEND_PORT}${path}`,
    options,
  );
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

export function createLabeledInput(type, id, labelText) {
  const container = document.createElement("div");

  const label = document.createElement("label");
  label.textContent = labelText;

  const input = document.createElement("input");
  input.id = id;
  input.type = type;

  container.appendChild(label);
  container.appendChild(input);
  return container;
}

export function printErrorMessage(message, parentElement) {
  const existing = document.getElementById("error-container");
  if (existing) existing.remove();

  const errorContainer = document.createElement("div");
  errorContainer.id = "error-container";

  const errorMsg = document.createElement("p");
  errorMsg.textContent = message;

  const errorClose = document.createElement("button");
  errorClose.id = "error-close";
  errorClose.textContent = "x";
  errorClose.addEventListener("click", () => {
    errorContainer.remove();
  });

  errorContainer.appendChild(errorMsg);
  errorContainer.appendChild(errorClose);
  parentElement.appendChild(errorContainer);
}

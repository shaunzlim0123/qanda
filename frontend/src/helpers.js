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
export const fileToDataUrl = (file) => {
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
};

/**
 * Makes an authenticated API request to the backend and returns parsed JSON.
 * Rejects with the server error message on failure or if the user is offline.
 * @param {string} path API endpoint path (e.g. "/thread").
 * @param {string} method HTTP method (GET, POST, PUT, DELETE).
 * @param {object|null} body Request body (ignored for GET).
 * @param {string} [token] JWT auth token from localStorage.
 * @return {Promise<object>} Parsed JSON response data.
 */
export const apiCall = (path, method, body, token) => {
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

  if (!navigator.onLine) {
    return Promise.reject(
      "You are offline. Please check your internet connection.",
    );
  }

  return fetch(`http://localhost:${BACKEND_PORT}${path}`, options)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        return Promise.reject(data.error);
      }
      return data;
    });
};

/**
 * Creates a labeled input element wrapped in a container div.
 * @param {string} type Input type (text, password, checkbox, file, etc.).
 * @param {string} id ID attribute for the input (also used by the label's "for").
 * @param {string} labelText Text content for the label.
 * @return {HTMLDivElement} Container div holding the label and input.
 */
export const createLabeledInput = (type, id, labelText) => {
  const container = document.createElement("div");
  if (type === "checkbox") container.classList.add("checkbox-group");

  const label = document.createElement("label");
  label.textContent = labelText;
  label.setAttribute("for", id);

  const input = document.createElement("input");
  input.id = id;
  input.type = type;

  container.appendChild(label);
  container.appendChild(input);
  return container;
};

/**
 * Displays a dismissible error banner inside the given parent element.
 * Removes any existing error banner first so only one is shown at a time.
 * @param {string} message The error text to display.
 * @param {HTMLElement} parentElement The element to append the error banner to.
 */
export const printErrorMessage = (message, parentElement) => {
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
};

export const getCurrentUserId = (token) => {
  return Number(JSON.parse(atob(token.split(".")[1])).userId);
};

export const formatTimeSince = (createdAt) => {
  const time = Math.floor((Date.now() - new Date(createdAt)) / 1000);
  if (time < 60) return "Just now";
  if (time < 3600) return `${Math.floor(time / 60)} minute(s) ago`;
  if (time < 86400) return `${Math.floor(time / 3600)} hour(s) ago`;
  if (time < 604800) return `${Math.floor(time / 86400)} day(s) ago`;
  return `${Math.floor(time / 604800)} week(s) ago`;
};

/**
 * Updates the URL hash to reflect the current page and data so that
 * the user can bookmark or share the link. Skips the update if the
 * hash is already correct to avoid triggering an infinite hashchange loop.
 * @param {string} page The current page name ("thread" or "profile").
 * @param {*} data Page-specific data (thread ID or user ID).
 */
export const updateHash = (page, data) => {
  let hash = "";
  if (page === "thread" && data) {
    hash = `#thread=${data}`;
  } else if (page === "profile") {
    const token = localStorage.getItem("token");
    hash = data === getCurrentUserId(token) ? "#profile" : `#profile=${data}`;
  }
  // prevent infinite loop of updating hash
  if (location.hash !== hash) location.hash = hash;
};

/**
 * Parses the current URL hash and returns the corresponding page and data.
 * Supports formats: #thread=<id>, #profile=<id>, and #profile (own profile).
 * @return {{ page: string, data: number } | null} Parsed route or null if unrecognised.
 */
export const parseHash = () => {
  const hash = location.hash;
  if (hash.startsWith("#thread=")) {
    return { page: "thread", data: Number(hash.split("=")[1]) };
  } else if (hash.startsWith("#profile=")) {
    return { page: "profile", data: Number(hash.split("=")[1]) };
  } else if (hash === "#profile") {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { page: "profile", data: getCurrentUserId(token) };
  }
  return null;
};

/**
 * Synchronous theme initialisation script.
 * Runs before the page paints to prevent a flash of the wrong theme.
 * Checks localStorage first, then falls back to the OS preference.
 */
(function () {
  var t = localStorage.getItem("theme");
  if (
    t === "dark" ||
    (!t && matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.dataset.theme = "dark";
  }
})();

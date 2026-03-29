import { apiCall, getCurrentUserId } from "./helpers.js";

export const startNotificationPolling = (app) => {
  seeded = false;
  Object.keys(commentCounts).forEach((k) => delete commentCounts[k]);

  pollWatchedThreads(app);
  app.notifyInterval = setInterval(() => pollWatchedThreads(app), 3000);
}

export const stopNotificationPolling = (app) => {
  if (app.notifyInterval) {
    clearInterval(app.notifyInterval);
    app.notifyInterval = null;
  }
}

// Snapshot of comment counts per watched thread
// on the first poll we seed this without firing notifications
const commentCounts = {};
let seeded = false;

let pingContainer = null;

const ensurePingContainer = () => {
  if (!pingContainer) {
    pingContainer = document.createElement("div");
    pingContainer.id = "ping-container";
    document.body.appendChild(pingContainer);
  }
}

const showPing = (threadTitle, threadId, app) => {
  ensurePingContainer();

  const ping = document.createElement("div");
  ping.classList.add("ping-alert");

  const icon = document.createElement("span");
  icon.classList.add("ping-icon");
  icon.textContent = "\u24D8";
  ping.appendChild(icon);

  const body = document.createElement("div");
  body.classList.add("ping-body");

  const heading = document.createElement("p");
  heading.classList.add("ping-heading");
  heading.textContent = "New Comment!";
  body.appendChild(heading);

  const text = document.createElement("p");
  text.classList.add("ping-text");
  text.textContent = threadTitle;
  body.appendChild(text);

  ping.appendChild(body);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "\u00d7";
  closeBtn.addEventListener("click", () => {
    ping.remove();
  });
  ping.appendChild(closeBtn);

  ping.addEventListener("click", (e) => {
    if (e.target === closeBtn) return;
    app.navigateTo("thread", threadId);
    ping.remove();
  });

  pingContainer.appendChild(ping);

  setTimeout(() => {
    if (ping.parentNode) ping.remove();
  }, 10000);
}

const pollWatchedThreads = (app) => {
  if (!navigator.onLine) return;
  const token = localStorage.getItem("token");
  const currentUserId = getCurrentUserId(token);

  apiCall("/user?userId=" + currentUserId, "GET", null, token)
    .then((userData) => {
      const watched = userData.threadsWatching || [];
      if (watched.length === 0) return;

      // fetch comments for each watched thread
      const promises = watched.map((threadId) =>
        apiCall("/comments?threadId=" + threadId, "GET", null, token)
          .then((comments) => ({ threadId, count: comments.length }))
          .catch(() => null),
      );

      return Promise.all(promises).then((results) => {
        results.forEach((result) => {
          if (!result) return;

          const prev = commentCounts[result.threadId];
          commentCounts[result.threadId] = result.count;

          // On first poll, dont notify
          if (!seeded) return;

          // only notify when count increase, ignore delete
          if (prev !== undefined && result.count > prev) {
            // Fetch thread title for notification
            apiCall("/thread?id=" + result.threadId, "GET", null, token)
              .then((thread) => {
                showPing(thread.title, result.threadId, app);
              })
              .catch(() => {});
          }
        });
        seeded = true;
      });
    })
    .catch(() => {});
}

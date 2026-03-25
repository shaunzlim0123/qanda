import { apiCall } from "./helpers.js";

export function startNotificationPolling(app) {
  seeded = false;
  Object.keys(commentCounts).forEach((k) => delete commentCounts[k]);

  pollWatchedThreads(app);
  app.notifyInterval = setInterval(() => pollWatchedThreads(app), 3000);
}

export function stopNotificationPolling(app) {
  if (app.notifyInterval) {
    clearInterval(app.notifyInterval);
    app.notifyInterval = null;
  }
}

// Snapshot of comment counts per watched thread
// on the first poll we seed this without firing notifications
const commentCounts = {};
let seeded = false;

function pollWatchedThreads(app) {
  const token = localStorage.getItem("token");
  if (!token) return;

  const currentUserId = Number(JSON.parse(atob(token.split(".")[1])).userId);

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

import {
  apiCall,
  createLabeledInput,
  fileToDataUrl,
  printErrorMessage,
} from "./helpers.js";

export function renderProfileContent(userId, content, app) {
  const container = document.createElement("div");
  container.classList.add("profile-container");
  content.appendChild(container);

  const token = localStorage.getItem("token");
  const currentUserId = Number(JSON.parse(atob(token.split(".")[1])).userId);

  const profileFetch = apiCall(`/user?userId=${userId}`, "GET", null, token);
  const currentUserFetch =
    userId === currentUserId
      ? profileFetch
      : apiCall(`/user?userId=${currentUserId}`, "GET", null, token);

  Promise.all([profileFetch, currentUserFetch])
    .then(([userData, currentUserData]) => {
      const name = document.createElement("h2");
      name.textContent = userData.name;
      container.appendChild(name);

      const email = document.createElement("p");
      email.textContent = userData.email;
      container.appendChild(email);

      const profilePic = document.createElement("img");
      profilePic.src = userData.image;
      profilePic.alt = userData.name;
      container.appendChild(profilePic);

      if (userId === currentUserId) {
        const updateProfile = document.createElement("button");
        updateProfile.textContent = "Update Profile";
        updateProfile.addEventListener("click", () => {
          showEditProfileModal(userId, app);
        });
        container.appendChild(updateProfile);
      }

      if (userData.admin) {
        const adminBadge = document.createElement("p");
        adminBadge.textContent = "Admin";
        container.appendChild(adminBadge);
      }

      if (currentUserData.admin && userId !== currentUserId) {
        const adminPermission = document.createElement("select");
        adminPermission.id = "user-permission";

        const userOption = document.createElement("option");
        userOption.value = "User";
        userOption.textContent = "User";
        const adminOption = document.createElement("option");
        adminOption.value = "Admin";
        adminOption.textContent = "Admin";
        adminPermission.appendChild(userOption);
        adminPermission.appendChild(adminOption);
        adminPermission.value = userData.admin ? "Admin" : "User";
        container.appendChild(adminPermission);

        const updateAdmin = document.createElement("button");
        updateAdmin.id = "user-permission-submit";
        updateAdmin.type = "button";
        updateAdmin.textContent = "Update";
        updateAdmin.addEventListener("click", () => {
          const turnon = adminPermission.value === "Admin";
          apiCall("/user/admin", "PUT", { userId, turnon }, token)
            .then(() => {
              app.navigateTo("profile", userId);
            })
            .catch((err) => {
              printErrorMessage(err, container);
            });
        });
        container.appendChild(updateAdmin);
      }

      const threadList = document.createElement("div");
      threadList.id = "profile-thread-list";
      container.appendChild(threadList);

      function loadAllThreads(start) {
        apiCall(`/threads?start=${start}`, "GET", null, token)
          .then((threadIds) => {
            const threadPromises = threadIds.map((id) =>
              apiCall(`/thread?id=${id}`, "GET", null, token),
            );
            return Promise.all(threadPromises);
          })
          .then((threads) => {
            const userThreads = threads.filter((t) => t.creatorId === userId);

            const commentPromises = userThreads.map((thread) =>
              apiCall(`/comments?threadId=${thread.id}`, "GET", null, token),
            );

            return Promise.all(commentPromises).then((commentsArrays) => {
              userThreads.forEach((thread, index) => {
                const threadBox = document.createElement("div");
                threadBox.classList.add("profile-thread-container");

                const title = document.createElement("h3");
                title.classList.add("profile-thread-title");
                title.textContent = thread.title;

                const threadContent = document.createElement("p");
                threadContent.classList.add("profile-thread-content");
                threadContent.textContent = thread.content;

                const likes = document.createElement("p");
                likes.classList.add("profile-thread-likes");
                likes.textContent = thread.likes.length;

                const comments = document.createElement("p");
                comments.classList.add("profile-thread-comments");
                comments.textContent = commentsArrays[index].length;

                threadBox.appendChild(title);
                threadBox.appendChild(threadContent);
                threadBox.appendChild(likes);
                threadBox.appendChild(comments);
                threadList.appendChild(threadBox);
              });

              if (threads.length >= 5) {
                loadAllThreads(start + 5);
              }
            });
          })
          .catch((err) => {
            printErrorMessage(err, threadList);
          });
      }

      loadAllThreads(0);
    })
    .catch((err) => {
      printErrorMessage(err, container);
    });
}

function showEditProfileModal(userId, app) {
  const token = localStorage.getItem("token");
  const backdrop = document.createElement("div");
  backdrop.classList.add("modal-backdrop");

  const modal = document.createElement("div");
  modal.id = "edit-profile-container";

  const heading = document.createElement("h2");
  heading.textContent = "Edit Profile";
  modal.appendChild(heading);

  const form = document.createElement("form");
  form.appendChild(createLabeledInput("text", "edit-profile-email", "Email"));
  form.appendChild(
    createLabeledInput("password", "edit-profile-password", "Password"),
  );
  form.appendChild(createLabeledInput("text", "edit-profile-name", "Name"));
  form.appendChild(createLabeledInput("file", "edit-profile-image", "Image"));

  const submitBtn = document.createElement("button");
  submitBtn.id = "edit-profile-submit";
  submitBtn.type = "button";
  submitBtn.textContent = "Save";
  submitBtn.addEventListener("click", () => {
    const email = document.getElementById("edit-profile-email").value;
    const password = document.getElementById("edit-profile-password").value;
    const name = document.getElementById("edit-profile-name").value;
    const fileInput = document.getElementById("edit-profile-image");
    const file = fileInput.files[0];

    const imagePromise = file
      ? fileToDataUrl(file)
      : Promise.resolve(undefined);

    imagePromise
      .then((image) => {
        const body = { email, name };
        if (password) body.password = password;
        if (image) body.image = image;
        return apiCall("/user", "PUT", body, token);
      })
      .then(() => {
        backdrop.remove();
        app.navigateTo("profile", userId);
      })
      .catch((err) => {
        printErrorMessage(err, modal);
      });
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => {
    backdrop.remove();
  });

  form.appendChild(submitBtn);
  form.appendChild(cancelBtn);
  modal.appendChild(form);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Pre-populate fields from current user data
  apiCall(`/user?userId=${userId}`, "GET", null, token)
    .then((userData) => {
      document.getElementById("edit-profile-email").value = userData.email;
      document.getElementById("edit-profile-name").value = userData.name;
    })
    .catch((err) => {
      printErrorMessage(err, modal);
    });
}

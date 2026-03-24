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

  Promise.all([profileFetch, currentUserFetch]).then(
    ([userData, currentUserData]) => {
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
    },
  );
}

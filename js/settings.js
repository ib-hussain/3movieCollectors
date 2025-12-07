// js/settings.js
// Settings page logic - Account management and password change

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSettings);
} else {
  initSettings();
}

async function initSettings() {
  console.log("[Settings] Initializing settings page");
  try {
    // Wait for App to be available
    if (typeof window.App === "undefined") {
      console.log("[Settings] Waiting for App...");
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (typeof window.App === "undefined") {
        console.error("[Settings] App not available!");
        return;
      }
    }

    await loadSettings();
    setupTabSwitching();
    setupPasswordToggles();
    setupAccountSave();
    setupPasswordChange();
    setupAccountDeletion();
    setupLogout();
    console.log("[Settings] Initialization complete");
  } catch (error) {
    console.error("[Settings] Initialization error:", error);
  }
}

// Also register with initPage for compatibility
window.initPage = window.initPage || {};
window.initPage.settings = initSettings;

// Load user settings from server
async function loadSettings() {
  try {
    const data = await App.get("/settings");

    if (data.success && data.user) {
      const user = data.user;

      // Populate account fields
      document.getElementById("displayName").value = user.name || "";
      document.getElementById("email").value = user.email || "";
      document.getElementById("username").value = user.username || "";
      document.getElementById("profilePicture").value =
        user.profilePicture || "";
    }
  } catch (error) {
    console.error("Error loading settings:", error);
    App.showError("Failed to load settings");
  }
}

// Tab switching functionality
function setupTabSwitching() {
  const tabButtons = document.querySelectorAll(".settings-tab-btn");
  const tabPanels = document.querySelectorAll(".settings-tab-panel");

  console.log("[Settings] Tab buttons found:", tabButtons.length);
  console.log("[Settings] Tab panels found:", tabPanels.length);

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      console.log("[Settings] Tab clicked:", btn.dataset.settingsTab);
      const targetTab = btn.dataset.settingsTab;

      // Update active tab button
      tabButtons.forEach((b) => b.classList.remove("settings-tab-btn--active"));
      btn.classList.add("settings-tab-btn--active");

      // Update active panel
      tabPanels.forEach((panel) => {
        const panelId = panel.id.replace("settings-panel-", "");
        if (panelId === targetTab) {
          panel.classList.add("settings-tab-panel--active");
        } else {
          panel.classList.remove("settings-tab-panel--active");
        }
      });
    });
  });
}

// Password visibility toggles
function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll(".password-toggle");

  toggleButtons.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = toggle.parentElement.querySelector(".password-input");
      const img = toggle.querySelector("img");

      if (input.type === "password") {
        input.type = "text";
        img.src = "../pictures/eye-closed.png";
      } else {
        input.type = "password";
        img.src = "../pictures/eye.png";
      }
    });
  });
}

// Save account changes
function setupAccountSave() {
  const saveBtn = document.getElementById("saveAccountBtn");
  console.log("[Settings] Save button found:", saveBtn);

  if (!saveBtn) {
    console.error("[Settings] Save button not found!");
    return;
  }

  saveBtn.addEventListener("click", async () => {
    console.log("[Settings] Save button clicked");
    const name = document.getElementById("displayName").value.trim();
    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();
    const profilePicture = document
      .getElementById("profilePicture")
      .value.trim();

    // Validate required fields
    if (!name || !email || !username) {
      App.showError("Name, email, and username are required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      App.showError("Please enter a valid email address");
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      App.showError(
        "Username must be 3-20 characters (letters, numbers, underscores only)"
      );
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      const data = await App.patch("/settings/account", {
        name,
        email,
        username,
        profilePicture: profilePicture || null,
      });

      if (data.success) {
        App.showSuccess("Account updated successfully");

        // Update current user in App
        if (window.App.currentUser && data.user) {
          window.App.currentUser = data.user;
        }

        // Reload to update navbar/profile display
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving account:", error);
      App.showError(error.message || "Failed to update account");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes";
    }
  });
}

// Change password
function setupPasswordChange() {
  const changeBtn = document.getElementById("changePasswordBtn");

  changeBtn.addEventListener("click", async () => {
    const currentPassword = document
      .getElementById("currentPassword")
      .value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();

    // Validate all fields filled
    if (!currentPassword || !newPassword || !confirmPassword) {
      App.showError("All password fields are required");
      return;
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      App.showError("New passwords do not match");
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      App.showError("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      App.showError("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      App.showError("Password must contain at least one lowercase letter");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      App.showError("Password must contain at least one number");
      return;
    }

    try {
      changeBtn.disabled = true;
      changeBtn.textContent = "Updating...";

      const data = await App.patch("/settings/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (data.success) {
        App.showSuccess("Password changed successfully");

        // Clear password fields
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";
      }
    } catch (error) {
      console.error("Error changing password:", error);
      App.showError(error.message || "Failed to change password");
    } finally {
      changeBtn.disabled = false;
      changeBtn.textContent = "Update Password";
    }
  });
}

// Account deletion with confirmation
function setupAccountDeletion() {
  const deleteBtn = document.getElementById("deleteAccountBtn");

  deleteBtn.addEventListener("click", async () => {
    // Show confirmation dialog
    const confirmed = confirm(
      "Are you absolutely sure you want to delete your account?\n\nThis action will:\n• Delete all your data\n• Remove you from all events and friend lists\n• Erase your reviews and posts\n\nThis action CANNOT be undone!"
    );

    if (!confirmed) return;

    // Ask for password confirmation
    const password = prompt(
      "Please enter your password to confirm account deletion:"
    );

    if (!password) {
      App.showInfo("Account deletion cancelled");
      return;
    }

    try {
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Deleting...";

      const response = await fetch("/api/settings/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete account");
      }

      if (data.success) {
        App.showSuccess("Account deleted successfully. Redirecting...");

        // Redirect to home page after delay
        setTimeout(() => {
          window.location.href = "/index.html";
        }, 2000);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      App.showError(error.message || "Failed to delete account");
      deleteBtn.disabled = false;
      deleteBtn.textContent = "Delete Account";
    }
  });
}

// Logout functionality
function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn.addEventListener("click", async () => {
    const confirmed = confirm("Are you sure you want to log out?");

    if (!confirmed) return;

    try {
      await App.post("/auth/logout", {});
      App.showSuccess("Logged out successfully");

      // Redirect to home page
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 500);
    } catch (error) {
      console.error("Error logging out:", error);
      // Even if logout fails, redirect anyway
      window.location.href = "/index.html";
    }
  });
}

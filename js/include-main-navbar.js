document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();
});

/* ===========================================
   Load Navbar HTML
=========================================== */
function loadNavbar() {
  fetch("../components/main-navbar.html")
    .then((res) => res.text())
    .then((html) => {
      const container = document.getElementById("navbar-container");

      if (container) {
        container.innerHTML = html;
      } else {
        document.body.insertAdjacentHTML("afterbegin", html);
      }

      setActiveNavbarItem();
      updateNotificationBadge();
      updateMessagesBadge();
    })
    .catch((err) => console.error("Navbar failed to load:", err));
}

/* ===========================================
   Determine Active Page
=========================================== */
function getPageKey() {
  // 1) Allow pages to explicitly define page type
  if (document.body.dataset.page) {
    return document.body.dataset.page;
  }

  // 2) Auto-detect by filename
  const file = window.location.pathname.split("/").pop().toLowerCase();

  if (file.startsWith("notifications")) return "notifications";
  if (file.startsWith("messages")) return "messages";
  if (file.startsWith("profile")) return "profile";
  if (file.startsWith("settings")) return "settings";
  if (file.startsWith("help")) return "help";

  return null;
}

/* ===========================================
   Apply Active State to Navbar
=========================================== */
function setActiveNavbarItem() {
  const key = getPageKey();
  if (!key) return;

  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const target = navbar.querySelector(`[data-nav="${key}"]`);
  if (!target) return;

  // Icon buttons (notifications & messages)
  if (target.classList.contains("icon-btn")) {
    target.classList.add("active");
  }

  // Profile (user-section)
  if (target.classList.contains("user-section")) {
    target.classList.add("active");
  }
}

/* ===========================================
   Update Notification Badge
=========================================== */
async function updateNotificationBadge() {
  try {
    if (!window.App) return; // App not loaded yet

    const data = await App.get("/notifications/unread-count");
    if (data.success) {
      const badge = document.querySelector(".notifications-badge");
      if (badge) {
        badge.textContent = data.count;
        badge.style.display = data.count > 0 ? "flex" : "none";
      }
    }
  } catch (error) {
    console.log(
      "Could not fetch notification count (user may not be logged in)"
    );
  }
}

// Make function available globally for updates
window.updateNotificationBadge = updateNotificationBadge;

/* ===========================================
   Update Messages Badge
=========================================== */
async function updateMessagesBadge() {
  try {
    if (!window.App) return; // App not loaded yet

    const data = await App.get("/messages/unread-count");
    if (data.success) {
      const badge = document.querySelector(".messages-badge");
      if (badge) {
        badge.textContent = data.count;
        badge.style.display = data.count > 0 ? "flex" : "none";
      }
    }
  } catch (error) {
    console.log("Could not fetch message count (user may not be logged in)");
  }
}

// Make function available globally for updates
window.updateMessagesBadge = updateMessagesBadge;

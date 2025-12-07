document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("sidepanel-container");

  // Load EXPANDED panel first
  fetch("../components/side-panel.html")
    .then((res) => res.text())
    .then((html) => {
      container.innerHTML = html;
      initializeSidePanel();
    });
});

/* ============================================================
   INITIALIZE PANEL: toggle, menu click, active highlight
============================================================ */
function initializeSidePanel() {
  const panel = document.querySelector(".side-panel");
  const toggleIcon = document.getElementById("sideToggleIcon");
  const menuItems = document.querySelectorAll(".menu-item");

  /* ---------------------------------------------------------
       ACTIVE MENU ITEM (based on current page)
    --------------------------------------------------------- */
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();

  menuItems.forEach((item) => {
    item.classList.remove("active");

    const link = item.getAttribute("data-link");
    if (!link) return;

    if (link.toLowerCase() === currentPage) {
      item.classList.add("active");
    }
  });

  /* ---------------------------------------------------------
       MENU NAVIGATION
    --------------------------------------------------------- */
  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      // Check if it's the logout item
      if (
        item.id === "logoutMenuItem" ||
        item.classList.contains("logout-item")
      ) {
        handleLogout();
        return;
      }

      const link = item.getAttribute("data-link");
      if (link) window.location.href = link;
    });
  });

  /* ---------------------------------------------------------
       TOGGLE SIDEBAR OPEN/COLLAPSE
    --------------------------------------------------------- */
  toggleIcon.addEventListener("click", () => {
    /* COLLAPSE */
    if (panel.classList.contains("expanded")) {
      panel.classList.remove("expanded");
      panel.classList.add("collapsed");

      // change icon to menu
      toggleIcon.src = "../pictures/menu.png";
      toggleIcon.style.opacity = "1";
    } else {
    /* EXPAND */
      panel.classList.remove("collapsed");
      panel.classList.add("expanded");

      // change icon to back
      toggleIcon.src = "../pictures/back.png";
      toggleIcon.style.opacity = "1";
    }

    updateContentShift();
  });

  // Apply initial shift
  updateContentShift();
}

/* ============================================================
   ADJUST PAGE LAYOUT BASED ON SIDEBAR WIDTH
============================================================ */
function updateContentShift() {
  const panel = document.querySelector(".side-panel");
  const content = document.querySelector(".content-area");
  const footer = document.querySelector(".footer"); // Changed to select .footer directly

  if (!panel) return;

  const isCollapsed = panel.classList.contains("collapsed");
  const width = isCollapsed ? 78 : 260;

  if (content) content.style.marginLeft = width + "px";
  if (footer) footer.style.marginLeft = width + "px"; // Apply margin to footer
}

/* ============================================================
   LOGOUT FUNCTIONALITY
============================================================ */
async function handleLogout() {
  const confirmed = confirm("Are you sure you want to log out?");

  if (!confirmed) return;

  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();

    if (data.success) {
      // Clear any cached data
      if (window.App && window.App.currentUser) {
        window.App.currentUser = null;
      }

      // Redirect to login page
      window.location.href = "/index.html";
    } else {
      alert("Logout failed. Please try again.");
    }
  } catch (error) {
    console.error("Logout error:", error);
    // Even if logout fails, redirect anyway for safety
    window.location.href = "/index.html";
  }
}

// Admin Dashboard JavaScript
const API_BASE = "/api/admin";
let activityChart = null;
let contentChart = null;
let pollingInterval = null;

// Configuration
const POLLING_INTERVAL = 30000; // 30 seconds
const CHART_COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
};

// ==================== INITIALIZATION ====================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[Admin Dashboard] Initializing...");

  // Check auth first, don't proceed if not authorized
  const isAuthorized = await checkAuth();
  if (!isAuthorized) {
    console.log("[Admin Dashboard] Not authorized, redirecting...");
    return; // Stop here if not authorized
  }

  console.log("[Admin Dashboard] Authorized, loading dashboard...");
  await initializeDashboard();
  startPolling();

  // Activity period selector
  document
    .getElementById("activity-period")
    ?.addEventListener("change", (e) => {
      loadActivityChart(e.target.value);
    });

  // Notification bell click - scroll to notifications section
  document
    .querySelector(".notification-bell")
    ?.addEventListener("click", () => {
      document.querySelector(".notifications-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

  // Handle hash navigation (e.g., from other pages)
  if (window.location.hash === "#notifications") {
    setTimeout(() => {
      document.querySelector(".notifications-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 500); // Wait for page to load
  }
});

// Check if user is authenticated as admin
async function checkAuth() {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();

    if (!response.ok || !data.success || data.user.role !== "admin") {
      console.error("Not authorized as admin:", data);
      window.location.href = "../login.html";
      return false; // Not authorized
    }

    // Update admin name in UI (use correct element ID)
    const adminNameEl = document.getElementById("adminName");
    if (adminNameEl) {
      adminNameEl.textContent = data.user.username || "Admin";
    }

    return true; // Authorized
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "../login.html";
    return false; // Not authorized
  }
}

// Initialize dashboard
async function initializeDashboard() {
  await Promise.all([
    loadDashboardStats(),
    loadRecentFlags(),
    loadActiveUsers(),
    loadAuditLog(),
    loadNotifications(),
    loadActivityChart(7),
    loadContentChart(),
  ]);
}

// Start polling for updates
function startPolling() {
  pollingInterval = setInterval(() => {
    loadDashboardStats();
    loadNotifications();
    loadRecentFlags();
  }, POLLING_INTERVAL);
}

// ==================== DASHBOARD STATS ====================

async function loadDashboardStats() {
  try {
    const response = await fetch(`${API_BASE}/dashboard/overview`);
    const data = await response.json();

    if (data.success) {
      const stats = data.stats;

      // Update stat cards
      document.getElementById("total-users").textContent =
        stats.totalUsers || 0;
      document.getElementById("total-movies").textContent =
        stats.totalMovies || 0;
      document.getElementById("pending-flags").textContent =
        stats.pendingFlags || 0;
      document.getElementById("total-posts").textContent =
        stats.postsToday || 0;

      // Update badge in sidebar
      const badge = document.getElementById("pending-flags-badge");
      if (badge) {
        badge.textContent = stats.pendingFlags || 0;
        badge.style.display = stats.pendingFlags > 0 ? "block" : "none";
      }

      // Update change indicators (you can calculate these from historical data)
      updateChangeIndicators(stats);
    }
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
  }
}

function updateChangeIndicators(stats) {
  // These would ideally come from the API comparing to previous period
  // For now, we'll show the raw numbers
  document.getElementById("users-change").textContent = `Total: ${
    stats.totalUsers || 0
  }`;
  document.getElementById("movies-change").textContent = `Total: ${
    stats.totalMovies || 0
  }`;
  document.getElementById("flags-change").textContent = `Pending: ${
    stats.pendingFlags || 0
  }`;
  document.getElementById("posts-change").textContent = `Today: ${
    stats.postsToday || 0
  }`;
}

// ==================== RECENT FLAGS ====================

async function loadRecentFlags() {
  try {
    const response = await fetch(`${API_BASE}/moderation/flags?limit=5`);
    const data = await response.json();

    const tbody = document.getElementById("recent-flags-table");

    if (data.success && data.flags.length > 0) {
      tbody.innerHTML = data.flags
        .map(
          (flag) => `
        <tr>
          <td><span class="badge badge-${flag.contentType.toLowerCase()}">${
            flag.contentType
          }</span></td>
          <td>${escapeHtml(flag.matchedWord || "N/A")}</td>
          <td>${formatDate(flag.flaggedDate)}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="viewFlag(${
              flag.flagID
            })">
              View
            </button>
          </td>
        </tr>
      `
        )
        .join("");
    } else {
      tbody.innerHTML =
        '<tr><td colspan="5" class="no-data">No pending flags</td></tr>';
    }
  } catch (error) {
    console.error("Error loading recent flags:", error);
    document.getElementById("recent-flags-table").innerHTML =
      '<tr><td colspan="5" class="error">Error loading data</td></tr>';
  }
}

function viewFlag(flagID) {
  window.location.href = `admin-moderation.html?flagID=${flagID}`;
}

function getOperationBadgeClass(operation) {
  const opLower = operation.toLowerCase();
  if (opLower === "insert" || opLower === "create") return "insert";
  if (opLower === "update" || opLower === "modify") return "update";
  if (opLower === "delete" || opLower === "remove") return "delete";
  return "update"; // default to info color
}

// ==================== ACTIVE USERS ====================

async function loadActiveUsers() {
  try {
    const response = await fetch(
      `${API_BASE}/dashboard/reports/user-activity?limit=5`
    );
    const data = await response.json();

    const tbody = document.getElementById("active-users-table");

    if (data.success && data.users.length > 0) {
      tbody.innerHTML = data.users
        .map(
          (user) => `
        <tr>
          <td><strong>${escapeHtml(user.username)}</strong></td>
          <td>${user.postCount || 0}</td>
          <td>${user.reviewCount || 0}</td>
          <td>${user.commentCount || 0}</td>
        </tr>
      `
        )
        .join("");
    } else {
      tbody.innerHTML =
        '<tr><td colspan="4" class="no-data">No active users</td></tr>';
    }
  } catch (error) {
    console.error("Error loading active users:", error);
    document.getElementById("active-users-table").innerHTML =
      '<tr><td colspan="4" class="error">Error loading data</td></tr>';
  }
}

// ==================== AUDIT LOG ====================

async function loadAuditLog() {
  try {
    const response = await fetch(`${API_BASE}/dashboard/audit-log?limit=5`);
    const data = await response.json();

    const tbody = document.getElementById("audit-log-table");

    if (data.success && data.logs.length > 0) {
      tbody.innerHTML = data.logs
        .map(
          (log) => `
        <tr>
          <td><strong>${escapeHtml(log.username || "System")}</strong></td>
          <td><span class="badge badge-${getOperationBadgeClass(
            log.operationPerformed
          )}">${log.operationPerformed}</span></td>
          <td>${escapeHtml(log.targetTable)}</td>
          <td class="truncate">${escapeHtml(log.actionDetails || "N/A")}</td>
          <td>${formatDateTime(log.timeStamp)}</td>
        </tr>
      `
        )
        .join("");
    } else {
      tbody.innerHTML =
        '<tr><td colspan="5" class="no-data">No recent actions</td></tr>';
    }
  } catch (error) {
    console.error("Error loading audit log:", error);
    document.getElementById("audit-log-table").innerHTML =
      '<tr><td colspan="5" class="error">Error loading data</td></tr>';
  }
}

// ==================== NOTIFICATIONS ====================

async function loadNotifications() {
  try {
    const response = await fetch(
      `${API_BASE}/dashboard/notifications?limit=10`
    );
    const data = await response.json();

    const container = document.getElementById("notifications-container");
    const countBadge = document.getElementById("notificationCount");

    if (data.success) {
      countBadge.textContent = data.unreadCount || 0;
      countBadge.style.display = data.unreadCount > 0 ? "block" : "none";

      if (data.notifications.length > 0) {
        container.innerHTML = data.notifications
          .map(
            (notif) => `
          <div class="notification-item ${notif.isRead ? "read" : "unread"}">
            <div class="notification-icon ${getNotificationIconClass(
              notif.notificationType
            )}">
              <i class="fas ${getNotificationIcon(notif.notificationType)}"></i>
            </div>
            <div class="notification-content">
              <h4>${escapeHtml(notif.title || "Notification")}</h4>
              <p>${escapeHtml(notif.message)}</p>
              <span class="notification-time">${formatDateTime(
                notif.createdDate
              )}</span>
            </div>
            ${
              !notif.isRead
                ? `<button class="btn-mark-read" data-notification-id="${notif.notificationID}">
                <i class="fas fa-check"></i>
              </button>`
                : ""
            }
          </div>
        `
          )
          .join("");
      } else {
        container.innerHTML = '<div class="no-data">No notifications</div>';
      }
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
    document.getElementById("notifications-container").innerHTML =
      '<div class="error">Error loading notifications</div>';
  }
}

async function markNotificationRead(notificationID) {
  try {
    const response = await fetch(
      `${API_BASE}/dashboard/notifications/${notificationID}/read`,
      {
        method: "PUT",
      }
    );

    if (response.ok) {
      loadNotifications();
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

// Event delegation for mark as read buttons
document.addEventListener("click", function (e) {
  if (e.target.closest(".btn-mark-read")) {
    const button = e.target.closest(".btn-mark-read");
    const notificationID = button.getAttribute("data-notification-id");
    if (notificationID) {
      markNotificationRead(notificationID);
    }
  }
});

// Event listener for Mark All Read button
document.addEventListener("DOMContentLoaded", function () {
  const markAllReadBtn = document.getElementById("mark-all-read-btn");
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", markAllRead);
  }
});

async function markAllRead() {
  try {
    const response = await fetch(
      `${API_BASE}/dashboard/notifications/mark-all-read`,
      {
        method: "PUT",
      }
    );

    if (response.ok) {
      loadNotifications();
    }
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
}

function getNotificationIcon(type) {
  const icons = {
    new_flag: "fa-flag",
    repeat_offender: "fa-user-slash",
    security_event: "fa-shield-alt",
    system_alert: "fa-exclamation-triangle",
    high_activity: "fa-chart-line",
    backup_status: "fa-database",
  };
  return icons[type] || "fa-bell";
}

function getNotificationIconClass(type) {
  const classes = {
    new_flag: "warning",
    repeat_offender: "danger",
    security_event: "danger",
    system_alert: "info",
    high_activity: "success",
    backup_status: "info",
  };
  return classes[type] || "info";
}

// ==================== CHARTS ====================

async function loadActivityChart(days = 7) {
  try {
    const response = await fetch(`${API_BASE}/dashboard/reports/content-stats`);
    const data = await response.json();

    if (data.success) {
      const ctx = document.getElementById("activity-chart");

      if (!ctx) return;

      // Destroy existing chart
      if (activityChart) {
        activityChart.destroy();
      }

      activityChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: ["Posts", "Reviews", "Comments", "Users", "Movies"],
          datasets: [
            {
              label: "Content Activity",
              data: [
                data.stats.totalPosts || 0,
                data.stats.totalReviews || 0,
                data.stats.totalComments || 0,
                data.stats.totalUsers || 0,
                data.stats.totalMovies || 0,
              ],
              borderColor: CHART_COLORS.primary,
              backgroundColor: CHART_COLORS.primary + "20",
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "#ffffff",
              pointBorderColor: CHART_COLORS.primary,
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error loading activity chart:", error);
  }
}

async function loadContentChart() {
  try {
    const response = await fetch(`${API_BASE}/dashboard/reports/content-stats`);
    const data = await response.json();

    if (data.success) {
      const ctx = document.getElementById("content-chart");

      if (!ctx) return;

      if (contentChart) {
        contentChart.destroy();
      }

      const stats = data.stats;

      contentChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Posts", "Reviews", "Comments"],
          datasets: [
            {
              data: [
                stats.totalPosts || 0,
                stats.totalReviews || 0,
                stats.totalComments || 0,
              ],
              backgroundColor: [
                CHART_COLORS.primary,
                CHART_COLORS.success,
                CHART_COLORS.warning,
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error loading content chart:", error);
  }
}

// ==================== UTILITY FUNCTIONS ====================

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "../login.html";
  } catch (error) {
    console.error("Logout error:", error);
    window.location.href = "../login.html";
  }
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  if (activityChart) {
    activityChart.destroy();
  }
  if (contentChart) {
    contentChart.destroy();
  }
});

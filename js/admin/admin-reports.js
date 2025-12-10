// Admin Reports Page JavaScript

let selectedFormat = "pdf";
let currentAdmin = null;

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  checkAdminAuth();
  loadStats();
  loadRecentReports();
  setupNotificationBell();

  // Set default date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  document.getElementById("startDate").value = formatDateTimeLocal(startDate);
  document.getElementById("endDate").value = formatDateTimeLocal(endDate);

  // Start polling for updates
  setInterval(() => {
    loadStats();
    loadRecentReports();
  }, 30000); // 30 seconds
});

// Check admin authentication
async function checkAdminAuth() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (!response.ok) {
      window.location.href = "../login.html";
      return;
    }

    const data = await response.json();

    if (!data.success || data.user.role !== "admin") {
      alert("Access denied. Admin privileges required.");
      window.location.href = "../login.html";
      return;
    }

    currentAdmin = data.user.username || "Admin";
    document.getElementById("adminName").textContent = currentAdmin;
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "../login.html";
  }
}

// Load statistics
async function loadStats() {
  try {
    // Get audit log count for REPORT CREATION
    const response = await fetch(
      "/api/admin/dashboard/audit-log?operation=REPORT%20CREATION&limit=10000",
      { credentials: "include" }
    );

    if (response.ok) {
      const data = await response.json();
      const reports = data.logs || [];

      // Total reports
      document.getElementById("totalReports").textContent = reports.length;

      // Reports today
      const today = new Date().toISOString().split("T")[0];
      const reportsToday = reports.filter((r) =>
        r.timeStamp.startsWith(today)
      ).length;
      document.getElementById("reportsToday").textContent = reportsToday;

      // Last report time
      if (reports.length > 0) {
        const lastReport = new Date(reports[0].timeStamp);
        document.getElementById("lastReportTime").textContent =
          formatTimeAgo(lastReport);
      }
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// Load recent reports from audit log
async function loadRecentReports() {
  try {
    const response = await fetch(
      "/api/admin/dashboard/audit-log?operation=REPORT%20CREATION&limit=10",
      { credentials: "include" }
    );

    if (!response.ok) {
      throw new Error("Failed to load recent reports");
    }

    const data = await response.json();
    const reports = data.logs || [];

    displayRecentReports(reports);
  } catch (error) {
    console.error("Error loading recent reports:", error);
  }
}

// Display recent reports in table
function displayRecentReports(reports) {
  const tbody = document.getElementById("recentReportsTable");

  if (reports.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="no-data">No recent reports found</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = reports
    .map((report) => {
      // Parse action details to extract report type and format
      const details = report.actionDetails || "";
      let reportType = "Unknown";
      let format = "Unknown";
      let filters = "None";

      // Extract report type
      if (details.includes("audit-log") || details.includes("Audit Log")) {
        reportType = "Audit Log";
      } else if (
        details.includes("user-activity") ||
        details.includes("User Activity")
      ) {
        reportType = "User Activity";
      } else if (
        details.includes("flagged-content") ||
        details.includes("Flagged Content")
      ) {
        reportType = "Flagged Content";
      } else if (
        details.includes("security-events") ||
        details.includes("Security Events")
      ) {
        reportType = "Security Events";
      }

      // Extract format
      if (details.toLowerCase().includes("pdf")) {
        format =
          '<span class="badge badge-pdf"><i class="fas fa-file-pdf"></i> PDF</span>';
      } else if (details.toLowerCase().includes("csv")) {
        format =
          '<span class="badge badge-csv"><i class="fas fa-file-csv"></i> CSV</span>';
      }

      // Extract filters
      if (details.includes("with filters:")) {
        const filterPart = details.split("with filters:")[1];
        filters = `<code>${filterPart.trim()}</code>`;
      }

      return `
        <tr>
          <td><strong>${reportType}</strong></td>
          <td>${report.username || "Unknown"}</td>
          <td>${format}</td>
          <td>${formatDateTime(report.timeStamp)}</td>
          <td>${filters}</td>
        </tr>
      `;
    })
    .join("");
}

// Update report description based on selected type
function updateReportDescription() {
  const reportType = document.getElementById("reportType").value;
  const descriptionEl = document.getElementById("reportDescription");
  const auditFilters = document.getElementById("auditLogFilters");

  const descriptions = {
    "audit-log":
      "Complete audit trail of all admin actions, system changes, and user modifications",
    "user-activity":
      "Comprehensive user engagement metrics including posts, reviews, comments, and activity scores",
    "flagged-content":
      "All flagged content with moderation status, matched words, and admin actions",
    "security-events":
      "Security incidents, failed login attempts, and suspicious activities",
  };

  descriptionEl.textContent = descriptions[reportType];

  // Show/hide audit log specific filters
  if (reportType === "audit-log") {
    auditFilters.style.display = "block";
  } else {
    auditFilters.style.display = "none";
  }
}

// Select export format
function selectFormat(format) {
  selectedFormat = format;

  // Update button states
  document.querySelectorAll(".format-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelector(`[data-format="${format}"]`).classList.add("active");
}

// Generate and download report
async function generateReport() {
  const reportType = document.getElementById("reportType").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const limit = document.getElementById("recordLimit").value;

  // Build query parameters
  const params = new URLSearchParams();

  if (startDate) {
    params.append("startDate", startDate);
  }

  if (endDate) {
    params.append("endDate", endDate);
  }

  params.append("limit", limit);

  // Add audit log specific filters
  if (reportType === "audit-log") {
    const operation = document.getElementById("operationType").value;
    const tableName = document.getElementById("tableName").value;

    if (operation) {
      params.append("operation", operation);
    }

    if (tableName) {
      params.append("tableName", tableName);
    }
  }

  // Build URL
  const url = `/api/admin/reports/${reportType}/${selectedFormat}?${params.toString()}`;

  try {
    // Show loading overlay
    document.getElementById("loadingOverlay").classList.add("active");

    // Fetch report
    const response = await fetch(url, { credentials: "include" });

    if (!response.ok) {
      throw new Error("Failed to generate report");
    }

    // Get blob
    const blob = await response.blob();

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${reportType}-${Date.now()}.${selectedFormat}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);

    // Show success message
    showNotification("Report generated successfully!", "success");

    // Reload stats and recent reports
    setTimeout(() => {
      loadStats();
      loadRecentReports();
    }, 1000);
  } catch (error) {
    console.error("Error generating report:", error);
    showNotification("Failed to generate report: " + error.message, "error");
  } finally {
    // Hide loading overlay
    document.getElementById("loadingOverlay").classList.remove("active");
  }
}

// Reset filters
function resetFilters() {
  // Reset to default date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  document.getElementById("startDate").value = formatDateTimeLocal(startDate);
  document.getElementById("endDate").value = formatDateTimeLocal(endDate);

  // Reset other filters
  document.getElementById("reportType").value = "audit-log";
  document.getElementById("operationType").value = "";
  document.getElementById("tableName").value = "";
  document.getElementById("recordLimit").value = "1000";

  // Reset format
  selectFormat("pdf");

  // Update description
  updateReportDescription();

  showNotification("Filters reset to default", "info");
}

// Setup notification bell
function setupNotificationBell() {
  const bell = document.querySelector(".notification-bell");
  bell.addEventListener("click", () => {
    window.location.href = "admin-dashboard.html#notifications";
  });

  // Load notification count
  loadNotificationCount();
  setInterval(loadNotificationCount, 30000);
}

// Load notification count
async function loadNotificationCount() {
  try {
    const response = await fetch("/api/admin/notifications/unread-count", {
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      const badge = document.getElementById("notificationCount");
      badge.textContent = data.count || 0;
      badge.style.display = data.count > 0 ? "block" : "none";
    }
  } catch (error) {
    console.error("Error loading notification count:", error);
  }
}

// Show notification message
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${
      type === "success"
        ? "check-circle"
        : type === "error"
        ? "exclamation-circle"
        : "info-circle"
    }"></i>
    <span>${message}</span>
  `;

  // Add to page
  document.body.appendChild(notification);

  // Show notification
  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Format date time for datetime-local input
function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Format date time for display
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format time ago
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}

// Toggle sidebar
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

// Logout
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        window.location.href = "../login.html";
      })
      .catch((error) => {
        console.error("Logout error:", error);
        window.location.href = "../login.html";
      });
  }
}

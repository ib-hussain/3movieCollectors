// Audit Log Management
const API_BASE = "/api/admin/dashboard";

// State
let currentPage = 1;
let totalPages = 1;
const itemsPerPage = 50;
let currentFilters = {};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeAuth();
  setupEventListeners();
  loadAuditLog();
  updateNotificationCount();
});

// Setup Event Listeners
function setupEventListeners() {
  // Filter buttons
  document
    .getElementById("applyFiltersBtn")
    .addEventListener("click", applyFilters);
  document
    .getElementById("clearFiltersBtn")
    .addEventListener("click", clearFilters);

  // Pagination
  document.getElementById("prevPageBtn").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      loadAuditLog();
    }
  });

  document.getElementById("nextPageBtn").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadAuditLog();
    }
  });

  // Export buttons
  document
    .getElementById("exportCsvBtn")
    .addEventListener("click", () => exportAuditLog("csv"));
  document
    .getElementById("exportPdfBtn")
    .addEventListener("click", () => exportAuditLog("pdf"));

  // Notification button
  document.getElementById("notificationBtn").addEventListener("click", () => {
    window.location.href = "/admin/admin-dashboard.html#notifications";
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", logout);
}

// Authentication
async function initializeAuth() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (!response.ok) {
      window.location.href = "/login.html";
      return;
    }

    const data = await response.json();
    if (data.user && data.user.role === "admin") {
      document.getElementById("adminName").textContent =
        data.user.username || "Admin";
    } else {
      window.location.href = "/login.html";
    }
  } catch (error) {
    console.error("Auth error:", error);
    window.location.href = "/login.html";
  }
}

// Load Audit Log
async function loadAuditLog() {
  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: itemsPerPage,
      ...currentFilters,
    });

    const response = await fetch(`${API_BASE}/audit-log?${params}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to load audit log");
    }

    const data = await response.json();

    if (data.success) {
      displayAuditLog(data.logs);
      updatePagination(data.pagination);
    } else {
      throw new Error(data.message || "Failed to load audit log");
    }
  } catch (error) {
    console.error("Error loading audit log:", error);
    displayError("Failed to load audit log. Please try again.");
  }
}

// Display Audit Log
function displayAuditLog(logs) {
  const tbody = document.getElementById("audit-log-tbody");

  if (!logs || logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="no-data">No audit log entries found</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs
    .map((log) => {
      const timestamp = new Date(log.timeStamp).toLocaleString();
      const adminName = log.username || `Admin #${log.adminID}`;
      const operationClass = getOperationClass(log.operationPerformed);

      return `
        <tr>
          <td><strong>#${log.logID}</strong></td>
          <td>${escapeHtml(adminName)}</td>
          <td><span class="badge badge-${operationClass}">${escapeHtml(
        log.operationPerformed
      )}</span></td>
          <td><code>${escapeHtml(log.targetTable)}</code></td>
          <td>#${log.targetRecordID}</td>
          <td><small>${timestamp}</small></td>
        </tr>
      `;
    })
    .join("");
}

// Get Operation Badge Class
function getOperationClass(operation) {
  const map = {
    INSERT: "success",
    UPDATE: "info",
    "DELETE CONTENT": "danger",
    MODERATION: "warning",
    MANAGEMENT: "primary",
    "REPORT CREATION": "secondary",
    "VIEW RESTRICTED CONTENT": "warning",
  };
  return map[operation] || "secondary";
}

// Update Pagination
function updatePagination(pagination) {
  if (!pagination) return;

  totalPages = pagination.totalPages;
  currentPage = pagination.page;

  const { page, limit, total } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  document.getElementById(
    "paginationInfo"
  ).textContent = `Showing ${start} - ${end} of ${total} entries`;
  document.getElementById(
    "pageIndicator"
  ).textContent = `Page ${page} of ${totalPages}`;

  document.getElementById("prevPageBtn").disabled = page === 1;
  document.getElementById("nextPageBtn").disabled = page >= totalPages;
}

// Apply Filters
function applyFilters() {
  currentFilters = {};

  const operation = document.getElementById("operationFilter").value;
  const tableName = document.getElementById("tableFilter").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (operation) currentFilters.operation = operation;
  if (tableName) currentFilters.tableName = tableName;
  if (startDate) currentFilters.startDate = startDate;
  if (endDate) currentFilters.endDate = endDate;

  currentPage = 1;
  loadAuditLog();
}

// Clear Filters
function clearFilters() {
  document.getElementById("operationFilter").value = "";
  document.getElementById("tableFilter").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";

  currentFilters = {};
  currentPage = 1;
  loadAuditLog();
}

// Export Audit Log
async function exportAuditLog(format) {
  try {
    const params = new URLSearchParams(currentFilters);
    const url = `/api/admin/reports/audit-log/${format}?${params}`;

    const response = await fetch(url, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to export ${format.toUpperCase()}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `audit-log-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    showNotification(
      `Audit log exported as ${format.toUpperCase()}`,
      "success"
    );
  } catch (error) {
    console.error(`Export ${format} error:`, error);
    showNotification(
      `Failed to export ${format.toUpperCase()}. Please try again.`,
      "error"
    );
  }
}

// Update Notification Count
async function updateNotificationCount() {
  try {
    const response = await fetch(`/api/admin/notifications/unread-count`, {
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      const countElement = document.getElementById("notificationCount");
      if (countElement && data.count !== undefined) {
        countElement.textContent = data.count;
        countElement.style.display = data.count > 0 ? "block" : "none";
      }
    }
  } catch (error) {
    console.log("Could not load notification count:", error.message);
  }
}

// Display Error
function displayError(message) {
  const tbody = document.getElementById("audit-log-tbody");
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}

// Show Notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${
      type === "success" ? "check-circle" : "exclamation-circle"
    }"></i>
    <span>${escapeHtml(message)}</span>
  `;

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === "success" ? "#2ecc71" : "#e74c3c"};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Logout
async function logout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/login.html";
  } catch (error) {
    console.error("Logout error:", error);
    window.location.href = "/login.html";
  }
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Add animation styles
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Admin User Management JavaScript

// State Management
let currentPage = 1;
let totalPages = 1;
let totalUsers = 0;
let currentFilters = {
  search: "",
  role: "",
  status: "",
};
let selectedUserId = null;
let searchTimeout = null;

// API Base URL
const API_BASE = "/api/admin";

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  console.log("Admin Users page initialized");
  checkAuth();
});

// Check if user is authenticated and is admin
async function checkAuth() {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();

    if (!response.ok || !data.success || data.user.role !== "admin") {
      alert("Access denied. Admin privileges required.");
      window.location.href = "../login.html";
      return;
    }

    document.getElementById("adminName").textContent =
      data.user.username || "Admin";

    // After successful auth check, initialize the page
    initializeEventListeners();
    loadStats();
    loadUsers();
    setupPolling();
  } catch (error) {
    console.error("Auth check failed:", error);
    alert("Access denied. Admin privileges required.");
    window.location.href = "../login.html";
  }
}

// Initialize Event Listeners
function initializeEventListeners() {
  // Notification button
  document.getElementById("notificationBtn").addEventListener("click", () => {
    window.location.href = "/html/admin/admin-dashboard.html#notifications";
  });

  // Logout buttons
  document.querySelectorAll(".btn-logout, #logoutBtn").forEach((btn) => {
    btn.addEventListener("click", logout);
  });

  // Search input with debounce
  document.getElementById("searchInput").addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentFilters.search = e.target.value.trim();
      currentPage = 1;
      console.log("Search filter changed:", currentFilters.search);
      loadUsers();
    }, 500);
  });

  // Role filter
  document.getElementById("roleFilter").addEventListener("change", (e) => {
    currentFilters.role = e.target.value;
    currentPage = 1;
    console.log("Role filter changed:", currentFilters.role);
    loadUsers();
  });

  // Status filter
  document.getElementById("statusFilter").addEventListener("change", (e) => {
    currentFilters.status = e.target.value;
    currentPage = 1;
    console.log("Status filter changed:", currentFilters.status);
    loadUsers();
  });

  // Reset filters
  document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("roleFilter").value = "";
    document.getElementById("statusFilter").value = "";
    currentFilters = { search: "", role: "", status: "" };
    currentPage = 1;
    console.log("Filters reset");
    loadUsers();
  });

  // Pagination
  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      loadUsers();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadUsers();
    }
  });

  // Modal close buttons
  document
    .getElementById("closeSuspendModal")
    .addEventListener("click", () => closeSuspendModal());
  document
    .getElementById("cancelSuspendBtn")
    .addEventListener("click", () => closeSuspendModal());

  document
    .getElementById("closeUnsuspendModal")
    .addEventListener("click", () => closeUnsuspendModal());
  document
    .getElementById("cancelUnsuspendBtn")
    .addEventListener("click", () => closeUnsuspendModal());

  document
    .getElementById("closeRoleModal")
    .addEventListener("click", () => closeRoleModal());
  document
    .getElementById("cancelRoleBtn")
    .addEventListener("click", () => closeRoleModal());

  // Close modals on outside click
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.classList.remove("show");
    }
  });

  // Form submissions
  document
    .getElementById("suspendForm")
    .addEventListener("submit", handleSuspend);
  document
    .getElementById("confirmUnsuspendBtn")
    .addEventListener("click", handleUnsuspend);
  document
    .getElementById("roleForm")
    .addEventListener("submit", handleRoleChange);
}

// Load Statistics
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/dashboard/overview`, {
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to load stats");

    const data = await response.json();
    const stats = data.stats || {};

    // Update stat cards
    document.getElementById("totalUsers").textContent = stats.totalUsers || 0;
    document.getElementById("activeUsers").textContent =
      (stats.totalUsers || 0) - (stats.suspendedUsers || 0);
    document.getElementById("suspendedUsers").textContent =
      stats.suspendedUsers || 0;

    // Fetch admin count separately
    const adminResponse = await fetch(`${API_BASE}/users?role=admin&limit=1`, {
      credentials: "include",
    });

    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      document.getElementById("adminUsers").textContent = adminData.total || 0;
    }

    console.log("Stats loaded:", stats);
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// Load Users with Filters and Pagination
async function loadUsers() {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage,
      limit: 10,
    });

    if (currentFilters.search) params.append("search", currentFilters.search);
    if (currentFilters.role) params.append("role", currentFilters.role);
    if (currentFilters.status) params.append("status", currentFilters.status);

    console.log("Loading users with params:", params.toString());

    const response = await fetch(`${API_BASE}/users?${params}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to load users");

    const data = await response.json();

    totalUsers = data.total || 0;
    totalPages = Math.ceil(totalUsers / 10) || 1;

    console.log(
      `Loaded ${
        data.users?.length || 0
      } users (Page ${currentPage}/${totalPages})`
    );

    renderUsers(data.users || []);
    updatePagination();
  } catch (error) {
    console.error("Error loading users:", error);
    showError("Failed to load users");
  }
}

// Render Users Table
function renderUsers(users) {
  const tbody = document.getElementById("usersTableBody");

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
          <i class="fas fa-users" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
          No users found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users
    .map(
      (user) => `
    <tr>
      <td>${user.userID}</td>
      <td><strong>${escapeHtml(user.username)}</strong></td>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>
        <span class="role-badge ${user.role}">${user.role.toUpperCase()}</span>
      </td>
      <td>
        <span class="status-badge ${user.isSuspended ? "suspended" : "active"}">
          ${user.isSuspended ? "Suspended" : "Active"}
        </span>
      </td>
      <td>${formatDate(user.registrationDate)}</td>
      <td>
        <div class="action-buttons">
          ${
            user.isSuspended
              ? `<button class="action-btn unsuspend" onclick="openUnsuspendModal(${
                  user.userID
                }, '${escapeHtml(user.username)}')">
                  <i class="fas fa-user-check"></i> Unsuspend
                </button>`
              : `<button class="action-btn suspend" onclick="openSuspendModal(${
                  user.userID
                }, '${escapeHtml(user.username)}')">
                  <i class="fas fa-user-slash"></i> Suspend
                </button>`
          }
          <button class="action-btn role" onclick="openRoleModal(${
            user.userID
          }, '${escapeHtml(user.username)}', '${user.role}')">
            <i class="fas fa-user-shield"></i> Role
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// Update Pagination Controls
function updatePagination() {
  document.getElementById("currentPage").textContent = currentPage;
  document.getElementById("totalPages").textContent = totalPages;
  document.getElementById("totalItems").textContent = totalUsers;

  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
}

// Open Suspend Modal
function openSuspendModal(userId, username) {
  selectedUserId = userId;
  document.getElementById(
    "suspendUserInfo"
  ).textContent = `@${username} (ID: ${userId})`;
  document.getElementById("suspensionReason").value = "";
  document.getElementById("suspendModal").classList.add("show");
}

// Close Suspend Modal
function closeSuspendModal() {
  document.getElementById("suspendModal").classList.remove("show");
  selectedUserId = null;
}

// Handle Suspend User
async function handleSuspend(e) {
  e.preventDefault();

  const reason = document.getElementById("suspensionReason").value.trim();
  if (!reason) {
    alert("Please provide a reason for suspension");
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/users/${selectedUserId}/suspend`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to suspend user");
    }

    console.log(`User ${selectedUserId} suspended`);
    showSuccess("User suspended successfully");
    closeSuspendModal();
    loadUsers();
    loadStats();
  } catch (error) {
    console.error("Error suspending user:", error);
    showError(error.message || "Failed to suspend user");
  }
}

// Open Unsuspend Modal
function openUnsuspendModal(userId, username) {
  selectedUserId = userId;
  document.getElementById(
    "unsuspendUserInfo"
  ).textContent = `@${username} (ID: ${userId})`;
  document.getElementById("unsuspendModal").classList.add("show");
}

// Close Unsuspend Modal
function closeUnsuspendModal() {
  document.getElementById("unsuspendModal").classList.remove("show");
  selectedUserId = null;
}

// Handle Unsuspend User
async function handleUnsuspend() {
  try {
    const response = await fetch(
      `${API_BASE}/users/${selectedUserId}/unsuspend`,
      {
        method: "PUT",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to unsuspend user");
    }

    console.log(`User ${selectedUserId} unsuspended`);
    showSuccess("User unsuspended successfully");
    closeUnsuspendModal();
    loadUsers();
    loadStats();
  } catch (error) {
    console.error("Error unsuspending user:", error);
    showError(error.message || "Failed to unsuspend user");
  }
}

// Open Role Change Modal
function openRoleModal(userId, username, currentRole) {
  selectedUserId = userId;
  document.getElementById(
    "roleUserInfo"
  ).textContent = `@${username} (ID: ${userId})`;
  document.getElementById("newRole").value = currentRole;
  document.getElementById("roleModal").classList.add("show");
}

// Close Role Modal
function closeRoleModal() {
  document.getElementById("roleModal").classList.remove("show");
  selectedUserId = null;
}

// Handle Role Change
async function handleRoleChange(e) {
  e.preventDefault();

  const newRole = document.getElementById("newRole").value;

  try {
    const response = await fetch(`${API_BASE}/users/${selectedUserId}/role`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: newRole }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to change user role");
    }

    console.log(`User ${selectedUserId} role changed to ${newRole}`);
    showSuccess("User role updated successfully");
    closeRoleModal();
    loadUsers();
    loadStats();
  } catch (error) {
    console.error("Error changing user role:", error);
    showError(error.message || "Failed to change user role");
  }
}

// Setup Polling for Real-time Updates
function setupPolling() {
  setInterval(() => {
    loadStats();
    // Update notification count if needed
    updateNotificationCount();
  }, 30000); // 30 seconds
}

// Update Notification Count
async function updateNotificationCount() {
  try {
    const response = await fetch(
      `/api/admin/dashboard/notifications/unread-count`,
      {
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      const countElement = document.getElementById("notificationCount");
      countElement.textContent = data.count || 0;
      countElement.style.display = data.count > 0 ? "flex" : "none";
    } else if (response.status === 404) {
      // Endpoint not implemented yet, silently ignore
      console.log("Notifications endpoint not yet implemented");
    }
  } catch (error) {
    // Silently ignore notification errors to avoid console spam
    console.log("Could not load notifications:", error.message);
  }
}

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function showSuccess(message) {
  // Simple alert for now, can be replaced with toast notification
  alert(message);
}

function showError(message) {
  // Simple alert for now, can be replaced with toast notification
  alert("Error: " + message);
}

async function logout() {
  if (confirm("Are you sure you want to logout?")) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    window.location.href = "../login.html";
  }
}

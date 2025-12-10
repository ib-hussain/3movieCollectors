// Admin Moderation Page JavaScript

// State
let currentTab = "flagged";
let currentFlagPage = 1;
let currentWordPage = 1;
let flagsPerPage = 20;
let wordsPerPage = 20;
let currentFlagFilters = {
  status: "pending",
  type: "",
};
let selectedFlagId = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  setupEventListeners();
  loadStats();
  loadFlaggedContent();
  setupPolling();
});

// Check authentication
async function checkAuth() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (!response.ok) {
      window.location.href = "/login.html";
      return;
    }

    const data = await response.json();
    if (data.user.role !== "admin") {
      alert("Access denied. Admin privileges required.");
      window.location.href = "/index.html";
      return;
    }

    document.getElementById("adminName").textContent =
      data.user.username || "Admin";
  } catch (error) {
    console.error("Auth check error:", error);
    window.location.href = "/login.html";
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Filters
  document.getElementById("statusFilter").addEventListener("change", (e) => {
    currentFlagFilters.status = e.target.value;
    currentFlagPage = 1;
    loadFlaggedContent();
  });

  document.getElementById("typeFilter").addEventListener("change", (e) => {
    currentFlagFilters.type = e.target.value;
    currentFlagPage = 1;
    loadFlaggedContent();
  });

  // Rescan button
  document.getElementById("rescanBtn").addEventListener("click", rescanContent);

  // Pagination - Flags
  document
    .getElementById("prevPageFlags")
    .addEventListener("click", () => changeFlagPage(-1));
  document
    .getElementById("nextPageFlags")
    .addEventListener("click", () => changeFlagPage(1));

  // Pagination - Words
  document
    .getElementById("prevPageWords")
    .addEventListener("click", () => changeWordPage(-1));
  document
    .getElementById("nextPageWords")
    .addEventListener("click", () => changeWordPage(1));

  // Add word
  document.getElementById("addWordBtn").addEventListener("click", addWord);
  document.getElementById("newWordInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") addWord();
  });

  // Bulk add
  document.getElementById("bulkAddBtn").addEventListener("click", bulkAddWords);

  // Modal actions
  document
    .getElementById("dismissFlagBtn")
    .addEventListener("click", dismissFlag);
  document
    .getElementById("deleteContentBtn")
    .addEventListener("click", deleteContent);

  // Notification button
  document.getElementById("notificationBtn").addEventListener("click", () => {
    window.location.href = "/admin/admin-dashboard.html#notifications";
  });
}

// Switch tabs
function switchTab(tab) {
  currentTab = tab;

  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  // Update tab content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.toggle("active", content.id === `${tab}-tab`);
  });

  // Load data for the active tab
  if (tab === "flagged") {
    loadFlaggedContent();
  } else {
    loadRestrictedWords();
  }
}

// Load statistics
async function loadStats() {
  try {
    // Load moderation stats
    const moderationResponse = await fetch("/api/admin/moderation/stats", {
      credentials: "include",
    });
    const moderationData = await moderationResponse.json();

    if (moderationData.success) {
      document.getElementById("pendingFlags").textContent =
        moderationData.stats.pendingFlags || 0;
      document.getElementById("dismissedFlags").textContent =
        moderationData.stats.dismissedToday || 0;
      document.getElementById("deletedContent").textContent =
        moderationData.stats.deletedToday || 0;
    }

    // Load restricted words stats
    const wordsResponse = await fetch("/api/admin/restricted-words/stats", {
      credentials: "include",
    });
    const wordsData = await wordsResponse.json();

    if (wordsData.success) {
      document.getElementById("restrictedWordsCount").textContent =
        wordsData.stats.totalWords || 0;
    }

    // Update notification count
    updateNotificationCount();
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// Update notification count
async function updateNotificationCount() {
  try {
    const response = await fetch(
      `/api/admin/dashboard/notifications/unread-count`,
      {
        credentials: "include",
      }
    );
    const data = await response.json();

    const countElement = document.getElementById("notificationCount");
    if (data.success && data.count > 0) {
      countElement.textContent = data.count;
      countElement.style.display = "block";
    } else {
      countElement.style.display = "none";
    }
  } catch (error) {
    console.error("Error updating notification count:", error);
  }
}

// Load flagged content
async function loadFlaggedContent() {
  const tbody = document.getElementById("flagsTableBody");
  tbody.innerHTML = `
    <tr>
      <td colspan="8" class="loading">
        <i class="fas fa-spinner fa-spin"></i> Loading flagged content...
      </td>
    </tr>
  `;

  try {
    const params = new URLSearchParams({
      status: currentFlagFilters.status,
      page: currentFlagPage,
      limit: flagsPerPage,
    });

    if (currentFlagFilters.type) {
      params.append("contentType", currentFlagFilters.type);
    }

    const response = await fetch(`/api/admin/moderation/flags?${params}`, {
      credentials: "include",
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    displayFlaggedContent(data.flags);
    updateFlagPagination(data.pagination);
  } catch (error) {
    console.error("Error loading flagged content:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="no-data">
          Error loading flagged content: ${error.message}
        </td>
      </tr>
    `;
  }
}

// Display flagged content
function displayFlaggedContent(flags) {
  const tbody = document.getElementById("flagsTableBody");

  if (flags.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="no-data">
          No flagged content found with current filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = flags
    .map(
      (flag) => `
    <tr>
      <td>${flag.flagID}</td>
      <td>
        <span class="content-type-badge ${flag.contentType.toLowerCase()}">
          ${flag.contentType}
        </span>
      </td>
      <td>${truncateText(
        flag.contentPreview || "No preview available",
        100
      )}</td>
      <td>${flag.matchedWord || "-"}</td>
      <td>${formatDate(flag.flaggedDate)}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn view" onclick="viewFlag(${flag.flagID})">
            <i class="fas fa-eye"></i> View
          </button>
          ${
            currentFlagFilters.status === "pending"
              ? `
            <button class="action-btn dismiss" onclick="quickDismiss(${flag.flagID})">
              <i class="fas fa-check"></i>
            </button>
            <button class="action-btn delete" onclick="quickDelete(${flag.flagID})">
              <i class="fas fa-trash"></i>
            </button>
          `
              : ""
          }
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// Update flag pagination
function updateFlagPagination(pagination) {
  const prevBtn = document.getElementById("prevPageFlags");
  const nextBtn = document.getElementById("nextPageFlags");
  const info = document.getElementById("paginationInfoFlags");

  prevBtn.disabled = pagination.page === 1;
  nextBtn.disabled = pagination.page >= pagination.totalPages;

  info.innerHTML = `Page <span>${pagination.page}</span> of <span>${pagination.totalPages}</span>`;
}

// Change flag page
function changeFlagPage(delta) {
  currentFlagPage += delta;
  loadFlaggedContent();
}

// Load restricted words
async function loadRestrictedWords() {
  const tbody = document.getElementById("wordsTableBody");
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="loading">
        <i class="fas fa-spinner fa-spin"></i> Loading restricted words...
      </td>
    </tr>
  `;

  try {
    const params = new URLSearchParams({
      page: currentWordPage,
      limit: wordsPerPage,
    });

    const response = await fetch(`/api/admin/restricted-words?${params}`, {
      credentials: "include",
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    displayRestrictedWords(data.words);
    updateWordPagination(data.pagination);
  } catch (error) {
    console.error("Error loading restricted words:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="no-data">
          Error loading restricted words: ${error.message}
        </td>
      </tr>
    `;
  }
}

// Display restricted words
function displayRestrictedWords(words) {
  const tbody = document.getElementById("wordsTableBody");

  if (words.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="no-data">
          No restricted words found. Add words to start filtering content.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = words
    .map(
      (word) => `
    <tr>
      <td>${word.wordID}</td>
      <td>${word.word}</td>
      <td>${formatDate(word.addedDate)}</td>
      <td>${word.flagCount || 0}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn delete" onclick="deleteWord(${
            word.wordID
          })">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// Update word pagination
function updateWordPagination(pagination) {
  const prevBtn = document.getElementById("prevPageWords");
  const nextBtn = document.getElementById("nextPageWords");
  const info = document.getElementById("paginationInfoWords");

  prevBtn.disabled = pagination.page === 1;
  nextBtn.disabled = pagination.page >= pagination.totalPages;

  info.innerHTML = `Page <span>${pagination.page}</span> of <span>${pagination.totalPages}</span>`;
}

// Change word page
function changeWordPage(delta) {
  currentWordPage += delta;
  loadRestrictedWords();
}

// View flag details
async function viewFlag(flagID) {
  selectedFlagId = flagID;
  const modal = document.getElementById("flagDetailsModal");
  const body = document.getElementById("flagDetailsBody");

  modal.classList.add("show");
  body.innerHTML = `
    <div class="loading-modal">
      <i class="fas fa-spinner fa-spin"></i> Loading flag details...
    </div>
  `;

  try {
    const response = await fetch(`/api/admin/moderation/flags/${flagID}`, {
      credentials: "include",
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    displayFlagDetails(data.flag);

    // Enable action buttons
    document.getElementById("dismissFlagBtn").disabled = false;
    document.getElementById("deleteContentBtn").disabled = false;
  } catch (error) {
    console.error("Error loading flag details:", error);
    body.innerHTML = `
      <div class="flag-detail-item">
        <p style="color: #ef4444;">Error loading flag details: ${error.message}</p>
      </div>
    `;
  }
}

// Display flag details in modal
function displayFlagDetails(flag) {
  const body = document.getElementById("flagDetailsBody");

  // Build content display
  let contentDisplay = "";
  if (flag.fullContent) {
    const content = flag.fullContent;
    if (flag.contentType === "Post") {
      contentDisplay = `
        <div class="content-detail">
          <strong>Author:</strong> ${content.authorUsername || "Unknown"}<br>
          <strong>Posted:</strong> ${formatDateTime(content.createdAt)}<br>
          <strong>Content:</strong><br>
          <div class="full-content">${content.postContent || "No content"}</div>
        </div>
      `;
    } else if (flag.contentType === "Comment") {
      contentDisplay = `
        <div class="content-detail">
          <strong>Author:</strong> ${content.authorUsername || "Unknown"}<br>
          <strong>Posted:</strong> ${formatDateTime(content.createdAt)}<br>
          <strong>Content:</strong><br>
          <div class="full-content">${
            content.commentContent || "No content"
          }</div>
        </div>
      `;
    } else if (flag.contentType === "Review") {
      contentDisplay = `
        <div class="content-detail">
          <strong>Author:</strong> ${content.authorUsername || "Unknown"}<br>
          <strong>Movie:</strong> ${content.movieTitle || "Unknown"}<br>
          <strong>Rating:</strong> ${content.rating || "N/A"}/10<br>
          <strong>Posted:</strong> ${formatDateTime(content.reviewDate)}<br>
          <strong>Review:</strong><br>
          <div class="full-content">${content.review || "No review text"}</div>
        </div>
      `;
    }
  } else {
    contentDisplay = `<div class="value" style="color: #ef4444;">Content has been deleted or is unavailable</div>`;
  }

  body.innerHTML = `
    <div class="flag-detail-item">
      <label>Flag ID</label>
      <div class="value">${flag.flagID}</div>
    </div>

    <div class="flag-detail-item">
      <label>Content Type</label>
      <div class="value">
        <span class="content-type-badge ${flag.contentType.toLowerCase()}">
          ${flag.contentType}
        </span>
      </div>
    </div>

    <div class="flag-detail-item">
      <label>Full Content</label>
      ${contentDisplay}
    </div>

    <div class="flag-detail-item">
      <label>Matched Restricted Word</label>
      <div class="value" style="color: #f59e0b; font-weight: 600;">
        ${flag.matchedWord || "N/A"}
      </div>
    </div>

    <div class="flag-detail-item">
      <label>Detection Method</label>
      <div class="value">System (Auto-flagged)</div>
    </div>

    <div class="flag-detail-item">
      <label>Flagged Date</label>
      <div class="value">${formatDateTime(flag.flaggedDate)}</div>
    </div>

    <div class="flag-detail-item">
      <label>Status</label>
      <div class="value">${flag.status}</div>
    </div>

    ${
      flag.adminNotes
        ? `
      <div class="flag-detail-item">
        <label>Admin Notes</label>
        <div class="value">${flag.adminNotes}</div>
      </div>
    `
        : ""
    }
  `;
}

// Close flag modal
function closeFlagModal() {
  document.getElementById("flagDetailsModal").classList.remove("show");
  selectedFlagId = null;
  document.getElementById("dismissFlagBtn").disabled = true;
  document.getElementById("deleteContentBtn").disabled = true;
}

// Quick dismiss (from table)
async function quickDismiss(flagID) {
  if (!confirm("Are you sure you want to dismiss this flag?")) return;

  try {
    const response = await fetch(
      `/api/admin/moderation/flags/${flagID}/dismiss`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          adminNotes: "Quick dismissed from moderation queue",
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    alert("Flag dismissed successfully");
    loadFlaggedContent();
    loadStats();
  } catch (error) {
    console.error("Error dismissing flag:", error);
    alert("Error dismissing flag: " + error.message);
  }
}

// Dismiss flag (from modal)
async function dismissFlag() {
  if (!selectedFlagId) return;
  if (!confirm("Are you sure you want to dismiss this flag?")) return;

  try {
    const response = await fetch(
      `/api/admin/moderation/flags/${selectedFlagId}/dismiss`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          adminNotes: "Dismissed after review",
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    alert("Flag dismissed successfully");
    closeFlagModal();
    loadFlaggedContent();
    loadStats();
  } catch (error) {
    console.error("Error dismissing flag:", error);
    alert("Error dismissing flag: " + error.message);
  }
}

// Quick delete (from table)
async function quickDelete(flagID) {
  if (
    !confirm(
      "Are you sure you want to DELETE this content? This action cannot be undone!"
    )
  )
    return;

  try {
    const response = await fetch(
      `/api/admin/moderation/flags/${flagID}/content`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          adminNotes: "Content deleted from moderation queue",
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    alert("Content deleted successfully");
    loadFlaggedContent();
    loadStats();
  } catch (error) {
    console.error("Error deleting content:", error);
    alert("Error deleting content: " + error.message);
  }
}

// Delete content (from modal)
async function deleteContent() {
  if (!selectedFlagId) return;
  if (
    !confirm(
      "Are you sure you want to DELETE this content? This action cannot be undone!"
    )
  )
    return;

  try {
    const response = await fetch(
      `/api/admin/moderation/flags/${selectedFlagId}/content`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          adminNotes: "Content deleted after review",
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    alert("Content deleted successfully");
    closeFlagModal();
    loadFlaggedContent();
    loadStats();
  } catch (error) {
    console.error("Error deleting content:", error);
    alert("Error deleting content: " + error.message);
  }
}

// Rescan content
async function rescanContent() {
  if (
    !confirm(
      "This will re-scan all content for restricted words. This may take a while. Continue?"
    )
  )
    return;

  const btn = document.getElementById("rescanBtn");
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
  btn.disabled = true;

  try {
    const response = await fetch("/api/admin/moderation/rescan", {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    alert(
      `Rescan complete!\nNew flags created: ${data.newFlags}\nContent scanned: ${data.scannedContent}`
    );
    loadFlaggedContent();
    loadStats();
  } catch (error) {
    console.error("Error rescanning content:", error);
    alert("Error rescanning content: " + error.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Add restricted word
async function addWord() {
  const input = document.getElementById("newWordInput");
  const word = input.value.trim();

  if (!word) {
    alert("Please enter a word");
    return;
  }

  try {
    const response = await fetch("/api/admin/restricted-words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ word }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    alert("Restricted word added successfully");
    input.value = "";
    loadRestrictedWords();
    loadStats();
  } catch (error) {
    console.error("Error adding word:", error);
    alert("Error adding word: " + error.message);
  }
}

// Bulk add restricted words
async function bulkAddWords() {
  const textarea = document.getElementById("bulkWordsInput");
  const text = textarea.value.trim();

  if (!text) {
    alert("Please enter words to add");
    return;
  }

  // Parse words (split by newline or comma)
  const words = text
    .split(/[\n,]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    alert("No valid words found");
    return;
  }

  if (!confirm(`Add ${words.length} restricted words?`)) return;

  try {
    const response = await fetch("/api/admin/restricted-words/bulk-add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ words }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    alert(
      `Bulk add complete!\nAdded: ${data.added}\nDuplicates skipped: ${data.duplicates}`
    );
    textarea.value = "";
    loadRestrictedWords();
    loadStats();
  } catch (error) {
    console.error("Error bulk adding words:", error);
    alert("Error bulk adding words: " + error.message);
  }
}

// Delete restricted word
async function deleteWord(wordID) {
  if (!confirm("Are you sure you want to delete this restricted word?")) return;

  try {
    const response = await fetch(`/api/admin/restricted-words/${wordID}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    alert("Restricted word deleted successfully");
    loadRestrictedWords();
    loadStats();
  } catch (error) {
    console.error("Error deleting word:", error);
    alert("Error deleting word: " + error.message);
  }
}

// Polling for live updates
function setupPolling() {
  setInterval(() => {
    loadStats();
    updateNotificationCount();
  }, 30000); // 30 seconds
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
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

// Close modal on outside click
window.onclick = function (event) {
  const modal = document.getElementById("flagDetailsModal");
  if (event.target === modal) {
    closeFlagModal();
  }
};

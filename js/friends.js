// friends.js - Dynamic Friends Page with API integration

document.addEventListener("DOMContentLoaded", () => {
  // State
  let allFriends = [];
  let allRequests = { incoming: [], outgoing: [] };
  let allSuggestions = [];
  let currentTab = "all-friends";

  // DOM Elements
  const tabs = document.querySelectorAll(".friends-tab");
  const panels = document.querySelectorAll(".friends-tab-panel");
  const friendsGrid = document.getElementById("friends-grid");
  const requestsGrid = document.getElementById("requests-grid");
  const suggestionsGrid = document.getElementById("suggestions-grid");
  const friendsCount = document.getElementById("friends-count");
  const requestsCount = document.getElementById("requests-count");
  const suggestionsCount = document.getElementById("suggestions-count");
  const searchInput = document.querySelector(".friends-search input");

  // Initialize
  init();

  async function init() {
    setupTabs();
    setupSearch();
    await loadAllData();
    handleURLParameters();
  }

  // Handle URL parameters for direct tab navigation
  function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");

    if (tabParam) {
      // Find the tab button with matching data-tab attribute
      const targetTab = document.querySelector(`[data-tab="${tabParam}"]`);
      if (targetTab) {
        targetTab.click();
      }
    }
  }

  // Tab switching
  function setupTabs() {
    tabs.forEach((tab) => {
      tab.addEventListener("click", async () => {
        const targetTab = tab.dataset.tab;
        if (targetTab === currentTab) return;

        // Update tab UI
        tabs.forEach((t) => {
          const isActive = t.dataset.tab === targetTab;
          t.classList.toggle("friends-tab--active", isActive);
          t.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        // Update panels
        panels.forEach((panel) => {
          const isActive = panel.id === targetTab;
          panel.classList.toggle("friends-tab-panel--active", isActive);
        });

        currentTab = targetTab;

        // Load data for the tab if not already loaded
        if (targetTab === "all-friends" && allFriends.length === 0) {
          await loadFriends();
        } else if (
          targetTab === "friend-requests" &&
          allRequests.incoming.length === 0 &&
          allRequests.outgoing.length === 0
        ) {
          await loadRequests();
        } else if (targetTab === "suggestions" && allSuggestions.length === 0) {
          await loadSuggestions();
        }
      });
    });
  }

  // Search functionality
  function setupSearch() {
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim().toLowerCase();
        filterCurrentTab(query);
      });
    }
  }

  function filterCurrentTab(query) {
    const activePanel = document.querySelector(
      ".friends-tab-panel.friends-tab-panel--active"
    );
    if (!activePanel) return;

    const cards = activePanel.querySelectorAll(".friend-card");
    cards.forEach((card) => {
      if (!query) {
        card.style.display = "";
        return;
      }
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(query) ? "" : "none";
    });
  }

  // Load all data on init
  async function loadAllData() {
    await Promise.all([loadFriends(), loadRequests(), loadSuggestions()]);
  }

  // Load friends
  async function loadFriends() {
    try {
      const response = await App.get("/friends");
      allFriends = response.friends || [];
      displayFriends(allFriends);
      updateCounts();
    } catch (error) {
      console.error("Error loading friends:", error);
      friendsGrid.innerHTML =
        '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">Failed to load friends.</p>';
    }
  }

  // Load friend requests
  async function loadRequests() {
    try {
      const response = await App.get("/friends/requests");
      allRequests = response || { incoming: [], outgoing: [] };
      displayRequests(allRequests);
      updateCounts();
    } catch (error) {
      console.error("Error loading requests:", error);
      requestsGrid.innerHTML =
        '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">Failed to load requests.</p>';
    }
  }

  // Load friend suggestions
  async function loadSuggestions() {
    try {
      const response = await App.get("/friends/suggestions");
      allSuggestions = response.suggestions || [];
      displaySuggestions(allSuggestions);
      updateCounts();
    } catch (error) {
      console.error("Error loading suggestions:", error);
      suggestionsGrid.innerHTML =
        '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">Failed to load suggestions.</p>';
    }
  }

  // Display friends
  function displayFriends(friends) {
    if (!friendsGrid) return;

    if (friends.length === 0) {
      friendsGrid.innerHTML =
        '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No friends yet. Check out suggestions!</p>';
      return;
    }

    friendsGrid.innerHTML = friends
      .map((friend) => createFriendCard(friend))
      .join("");
  }

  // Display requests
  function displayRequests(requests) {
    if (!requestsGrid) return;

    const { incoming, outgoing } = requests;

    if (incoming.length === 0 && outgoing.length === 0) {
      requestsGrid.innerHTML =
        '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No pending friend requests.</p>';
      return;
    }

    let html = "";

    if (incoming.length > 0) {
      html +=
        '<h3 style="margin-bottom: 1rem; color: #2c3e50;">Incoming Requests</h3>';
      html += incoming
        .map((request) => createRequestCard(request, "incoming"))
        .join("");
    }

    if (outgoing.length > 0) {
      html +=
        '<h3 style="margin: 2rem 0 1rem; color: #2c3e50;">Outgoing Requests</h3>';
      html += outgoing
        .map((request) => createRequestCard(request, "outgoing"))
        .join("");
    }

    requestsGrid.innerHTML = html;
  }

  // Display suggestions
  function displaySuggestions(suggestions) {
    if (!suggestionsGrid) return;

    if (suggestions.length === 0) {
      suggestionsGrid.innerHTML =
        '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No friend suggestions available.</p>';
      return;
    }

    suggestionsGrid.innerHTML = suggestions
      .map((suggestion) => createSuggestionCard(suggestion))
      .join("");
  }

  // Create friend card HTML
  function createFriendCard(friend) {
    const fullName = friend.firstName || friend.name || "Unknown";
    const initials = getInitials(fullName);
    const username = friend.username || friend.email.split("@")[0];

    return `
            <article class="friend-card" data-user-id="${friend.userID}">
                <header class="friend-card-header" style="cursor: pointer;" onclick="window.location.href='profile.html?user=${username}'">
                    <div class="friend-user">
                        <div class="friend-avatar">${initials}</div>
                        <div class="friend-meta">
                            <h3>${fullName}</h3>
                            <span class="friend-handle">@${username}</span>
                        </div>
                    </div>
                </header>

                <div class="friend-info-row">
                    <span class="friend-info-label">Friends since</span>
                    <span class="friend-info-value">${formatDate(
                      friend.friendshipDate
                    )}</span>
                </div>

                <div class="friend-card-footer">
                    <button class="friend-btn friend-btn--secondary" onclick="window.friendsPage.openMessage(${
                      friend.userID
                    })">
                        Message
                    </button>
                    <button class="friend-btn friend-btn--danger" onclick="window.friendsPage.unfriend(${
                      friend.userID
                    })">
                        Unfriend
                    </button>
                </div>
            </article>
        `;
  }

  // Create request card HTML
  function createRequestCard(request, type) {
    const fullName = request.firstName || request.name || "Unknown";
    const initials = getInitials(fullName);
    const userId = type === "incoming" ? request.senderID : request.receiverID;
    const timeAgo = getTimeAgo(request.requestDate);

    if (type === "incoming") {
      return `
                <article class="friend-card friend-card--request" data-request-id="${
                  request.requestID
                }">
                    <header class="friend-card-header">
                        <div class="friend-user">
                            <div class="friend-avatar">${initials}</div>
                            <div class="friend-meta">
                                <h3>${fullName}</h3>
                                <span class="friend-handle">@${
                                  request.email.split("@")[0]
                                }</span>
                                <span class="friend-request-meta">${timeAgo}</span>
                            </div>
                        </div>
                    </header>

                    <div class="friend-request-actions">
                        <button class="friend-btn friend-btn--accept" onclick="window.friendsPage.acceptRequest(${
                          request.requestID
                        })">
                            Accept
                        </button>
                        <button class="friend-btn friend-btn--decline" onclick="window.friendsPage.declineRequest(${
                          request.requestID
                        })">
                            Decline
                        </button>
                    </div>
                </article>
            `;
    } else {
      return `
                <article class="friend-card friend-card--request" data-request-id="${
                  request.requestID
                }">
                    <header class="friend-card-header">
                        <div class="friend-user">
                            <div class="friend-avatar">${initials}</div>
                            <div class="friend-meta">
                                <h3>${fullName}</h3>
                                <span class="friend-handle">@${
                                  request.email.split("@")[0]
                                }</span>
                                <span class="friend-request-meta">Sent ${timeAgo}</span>
                            </div>
                        </div>
                    </header>

                    <div class="friend-request-actions">
                        <span style="color: #95a5a6; font-size: 0.9rem;">Pending...</span>
                    </div>
                </article>
            `;
    }
  }

  // Create suggestion card HTML
  function createSuggestionCard(suggestion) {
    const fullName = suggestion.firstName || suggestion.name || "Unknown";
    const initials = getInitials(fullName);
    const mutualCount = suggestion.mutualFriendsCount || 0;

    return `
            <article class="friend-card friend-card--suggestion" data-user-id="${
              suggestion.userID
            }">
                <header class="friend-card-header">
                    <div class="friend-user">
                        <div class="friend-avatar">${initials}</div>
                        <div class="friend-meta">
                            <h3>${fullName}</h3>
                            <span class="friend-handle">@${
                              suggestion.email.split("@")[0]
                            }</span>
                            <span class="friend-suggestion-meta">Based on mutual friends</span>
                        </div>
                    </div>
                </header>

                <div class="friend-suggestion-meta-bottom">
                    ${mutualCount} mutual friend${mutualCount !== 1 ? "s" : ""}
                </div>

                <div class="friend-suggestion-actions">
                    <button class="friend-btn friend-btn--primary-wide" onclick="window.friendsPage.sendRequest(${
                      suggestion.userID
                    })">
                        Add Friend
                    </button>
                </div>
            </article>
        `;
  }

  // Accept friend request
  async function acceptRequest(requestId) {
    try {
      await App.post(`/friends/requests/${requestId}/accept`);
      // Reload all data to update friends, requests, and mutual friends counts in suggestions
      await Promise.all([loadFriends(), loadRequests(), loadSuggestions()]);
      alert("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept friend request.");
    }
  }

  // Decline friend request
  async function declineRequest(requestId) {
    try {
      await App.post(`/friends/requests/${requestId}/decline`);
      // Reload requests and suggestions to show declined user in suggestions again
      await Promise.all([loadRequests(), loadSuggestions()]);
      alert("Friend request declined.");
    } catch (error) {
      console.error("Error declining request:", error);
      alert("Failed to decline friend request.");
    }
  }

  // Send friend request
  async function sendRequest(userId) {
    try {
      await App.post("/friends/requests", { receiverId: userId });
      // Reload suggestions and requests to show the outgoing request
      await Promise.all([loadSuggestions(), loadRequests()]);
      alert("Friend request sent!");
    } catch (error) {
      console.error("Error sending request:", error);
      alert(error.error || "Failed to send friend request.");
    }
  }

  // Unfriend (instant, no confirmation)
  async function unfriend(userId) {
    try {
      await App.delete(`/friends/${userId}`);
      // Reload friends and suggestions
      await Promise.all([loadFriends(), loadSuggestions()]);
    } catch (error) {
      console.error("Error unfriending:", error);
      alert("Failed to unfriend user.");
    }
  }

  // Open message (navigate to messages page with user ID)
  function openMessage(userId) {
    // Navigate to messages page with this friend's conversation
    // This will be implemented when we build the Messages feature
    window.location.href = `/messages.html?userId=${userId}`;
  }

  // Update counts
  function updateCounts() {
    if (friendsCount) friendsCount.textContent = allFriends.length;
    if (requestsCount)
      requestsCount.textContent =
        allRequests.incoming.length + allRequests.outgoing.length;
    if (suggestionsCount) suggestionsCount.textContent = allSuggestions.length;
  }

  // Helper functions
  function getInitials(fullName) {
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(
        0
      )}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${
        Math.floor(diffDays / 7) !== 1 ? "s" : ""
      } ago`;
    return `${Math.floor(diffDays / 30)} month${
      Math.floor(diffDays / 30) !== 1 ? "s" : ""
    } ago`;
  }

  // Expose functions globally for onclick handlers
  window.friendsPage = {
    acceptRequest,
    declineRequest,
    sendRequest,
    unfriend,
    openMessage,
  };
});

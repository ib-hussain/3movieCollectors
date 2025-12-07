// Notifications Page - Real-time notifications system

let currentFilter = "all";
let notifications = [];
let pollInterval = null;

window.initPage = window.initPage || {};
window.initPage.notifications = async function () {
  await loadNotifications();
  setupEventListeners();
  startRealTimePolling();
};

async function loadNotifications() {
  try {
    const data = await App.get(`/notifications?filter=${currentFilter}`);

    if (data.success) {
      notifications = data.notifications;
      displayNotifications(data.notifications);
      updateCounts(data.unreadCount);
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
    App.showError("Failed to load notifications");
  }
}

function displayNotifications(notificationsList) {
  const container = document.getElementById("notificationsContainer");

  if (!notificationsList || notificationsList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #7f8c8d;">
        <p style="font-size: 18px; margin-bottom: 8px;">No notifications yet</p>
        <p style="font-size: 14px; opacity: 0.8;">You'll see your activity updates here</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  notificationsList.forEach((notif) => {
    const item = createNotificationItem(notif);
    container.appendChild(item);
  });
}

function createNotificationItem(notif) {
  const item = document.createElement("div");
  item.className = "notification-item";
  item.dataset.id = notif.notificationID;
  item.dataset.status = notif.isSeen ? "read" : "unread";

  const profilePic = notif.triggerProfilePicture || "../pictures/profile.png";
  const timeAgo = getTimeAgo(new Date(notif.timeStamp));

  // Determine icon and action based on event type
  const { icon, actionText, link } = getNotificationDetails(notif);

  item.innerHTML = `
    <img src="${profilePic}" alt="${
    notif.triggerName || "User"
  }" class="notification-avatar">
    <div class="notification-content">
      <p class="notification-text">
        <strong class="notification-user" data-username="${
          notif.triggerUsername || ""
        }">${notif.triggerName || "Someone"}</strong>
        ${actionText}
      </p>
      <span class="notification-time">${timeAgo}</span>
    </div>
    <div class="notification-icon">${icon}</div>
    ${!notif.isSeen ? '<span class="notification-unread-dot"></span>' : ""}
  `;

  // Click handler
  item.addEventListener("click", async () => {
    // Mark as read
    if (!notif.isSeen) {
      await markAsRead(notif.notificationID);
    }

    // Navigate to relevant page if applicable
    if (link) {
      window.location.href = link;
    }
  });

  return item;
}

function getNotificationDetails(notif) {
  switch (notif.triggerEvent) {
    case "friend_request":
      return {
        icon: "👥",
        actionText: "sent you a friend request",
        link: "friends.html?tab=friend-requests",
      };
    case "friend_accept":
      return {
        icon: "✅",
        actionText: "accepted your friend request",
        link: `profile.html?user=${notif.triggerUsername}`,
      };
    case "new_post":
      // Check if this is an event notification (content contains "event")
      if (
        notif.content &&
        (notif.content.includes("joined your event") ||
          notif.content.includes("cancelled the event"))
      ) {
        return {
          icon: "📅",
          actionText: notif.content,
          link: notif.relatedID ? `events.html` : null,
        };
      }
      // Otherwise it's a movie post
      return {
        icon: "📝",
        actionText: `posted about a movie`,
        link:
          notif.movieId && notif.relatedID
            ? `movie.html?id=${notif.movieId}&tab=discussion&postId=${notif.relatedID}`
            : null,
      };
    case "post_like":
      return {
        icon: "❤️",
        actionText: "liked your post",
        link:
          notif.movieId && notif.relatedID
            ? `movie.html?id=${notif.movieId}&tab=discussion&postId=${notif.relatedID}`
            : null,
      };
    case "post_comment":
      return {
        icon: "💬",
        actionText: "commented on your post",
        link:
          notif.movieId && notif.relatedID
            ? `movie.html?id=${notif.movieId}&tab=discussion&postId=${notif.relatedID}`
            : null,
      };
    case "review":
      return {
        icon: "⭐",
        actionText: "reviewed a movie",
        link: notif.relatedID
          ? `movie.html?id=${notif.relatedID}&tab=reviews`
          : null,
      };
    default:
      return {
        icon: "🔔",
        actionText: notif.content || "performed an action",
        link: null,
      };
  }
}

function updateCounts(unreadCount) {
  const unreadCountEl = document.getElementById("unreadCount");
  const unreadTabCount = document.getElementById("unreadTabCount");
  const allCount = document.getElementById("allCount");

  if (unreadCountEl) unreadCountEl.textContent = unreadCount;
  if (unreadTabCount) unreadTabCount.textContent = unreadCount;
  if (allCount) allCount.textContent = notifications.length;

  // Update navbar badge
  updateNavbarBadge(unreadCount);
}

function updateNavbarBadge(count) {
  const badge = document.querySelector(".notifications-badge");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
}

async function markAsRead(notificationId) {
  try {
    await App.patch(`/notifications/${notificationId}/read`);

    // Update local state
    const notif = notifications.find(
      (n) => n.notificationID === notificationId
    );
    if (notif) {
      notif.isSeen = true;
    }

    // Update UI
    const item = document.querySelector(
      `.notification-item[data-id="${notificationId}"]`
    );
    if (item) {
      item.dataset.status = "read";
      const dot = item.querySelector(".notification-unread-dot");
      if (dot) dot.remove();
    }

    // Recalculate counts
    const unreadCount = notifications.filter((n) => !n.isSeen).length;
    updateCounts(unreadCount);

    // Update navbar badge
    if (typeof window.updateNotificationBadge === "function") {
      window.updateNotificationBadge();
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

async function markAllAsRead() {
  try {
    await App.post("/notifications/mark-all-read");

    // Update all notifications to read
    notifications.forEach((n) => (n.isSeen = true));

    // Update UI
    document.querySelectorAll(".notification-item").forEach((item) => {
      item.dataset.status = "read";
      const dot = item.querySelector(".notification-unread-dot");
      if (dot) dot.remove();
    });

    updateCounts(0);
    App.showSuccess("All notifications marked as read");

    // Update navbar badge
    if (typeof window.updateNotificationBadge === "function") {
      window.updateNotificationBadge();
    }
  } catch (error) {
    console.error("Error marking all as read:", error);
    App.showError("Failed to mark all as read");
  }
}

function setupEventListeners() {
  // Tab switching
  const tabs = document.querySelectorAll(".notifications-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("notifications-tab--active"));
      tab.classList.add("notifications-tab--active");

      currentFilter = tab.dataset.tab;
      loadNotifications();
    });
  });

  // Mark all as read button
  const markAllBtn = document.querySelector(".mark-all-read-btn");
  if (markAllBtn) {
    markAllBtn.addEventListener("click", markAllAsRead);
  }
}

function startRealTimePolling() {
  // Poll for new notifications every 10 seconds
  pollInterval = setInterval(async () => {
    try {
      const data = await App.get("/notifications/unread-count");
      if (data.success) {
        const currentUnread = notifications.filter((n) => !n.isSeen).length;

        // If count changed, reload notifications
        if (data.count !== currentUnread) {
          await loadNotifications();
        }

        // Always update navbar badge
        updateNavbarBadge(data.count);
      }
    } catch (error) {
      console.error("Error polling notifications:", error);
    }
  }, 10000); // Poll every 10 seconds
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return App.formatDate(date);
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});

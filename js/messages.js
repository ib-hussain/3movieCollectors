// messages.js - Dynamic Messages with real-time updates

document.addEventListener("DOMContentLoaded", () => {
  // State
  let threads = [];
  let currentFriendId = null;
  let messages = [];
  let pollInterval = null;

  // DOM Elements
  const layout = document.getElementById("messagesLayout");
  const threadsList = document.querySelector(".thread-items");
  const inputField = document.querySelector(".conversation-input");
  const sendBtn = document.querySelector(".conversation-send-btn");
  const chatBody = document.querySelector(".conversation-body");
  const conversationName = document.querySelector(".conversation-name");
  const conversationAvatar = document.querySelector(".conversation-avatar img");

  // Initialize
  init();

  async function init() {
    // Get current user first
    const user = await App.getCurrentUser();
    if (!user) {
      console.error("[Messages] Failed to load user");
      return;
    }

    await loadThreads();
    setupEventListeners();
  }

  // ----------------------------
  // 1. LOAD THREADS LIST
  // ----------------------------
  async function loadThreads() {
    try {
      const response = await App.get("/messages/threads");
      threads = response.threads || [];
      renderThreads();
    } catch (error) {
      console.error("Error loading threads:", error);
      App.showError("Failed to load conversations");
    }
  }

  function renderThreads() {
    threadsList.innerHTML = "";

    if (threads.length === 0) {
      threadsList.innerHTML = `
        <li class="thread-empty-state" style="text-align: center; padding: 60px 20px; color: var(--TextColor); min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <p style="font-size: 14px; opacity: 0.7;">No conversations yet. Message a friend to start chatting!</p>
        </li>
      `;
      return;
    }

    threads.forEach((thread) => {
      const threadItem = createThreadItem(thread);
      threadsList.appendChild(threadItem);
    });
  }

  function createThreadItem(thread) {
    const li = document.createElement("li");
    li.className = "thread-item";
    li.dataset.friendId = thread.friendId;

    if (thread.unreadCount > 0) {
      li.classList.add("thread-item--unread");
    }

    const profilePic = thread.friendProfilePicture || "../pictures/profile.png";
    const lastMessage = thread.lastMessage || "No messages yet";
    const timeAgo = thread.lastMessageTime
      ? getTimeAgo(new Date(thread.lastMessageTime))
      : "";

    li.innerHTML = `
      <div class="thread-avatar">
        <img src="${profilePic}" alt="${thread.friendName}">
      </div>
      <div class="thread-main">
        <div class="thread-main-top">
          <span class="thread-name">${thread.friendName}</span>
          <span class="thread-time">${timeAgo}</span>
        </div>
        <div class="thread-main-bottom">
          <span class="thread-snippet">${truncate(lastMessage, 50)}</span>
          ${
            thread.unreadCount > 0
              ? `<span class="thread-unread-badge">${thread.unreadCount}</span>`
              : ""
          }
        </div>
      </div>
    `;

    li.addEventListener("click", () => openConversation(thread.friendId));

    return li;
  }

  // ----------------------------
  // 2. OPEN A CONVERSATION
  // ----------------------------
  async function openConversation(friendId) {
    currentFriendId = friendId;

    // Update UI state
    layout.classList.remove("messages-layout--empty");
    layout.classList.add("messages-layout--active");

    // Update thread selection
    document.querySelectorAll(".thread-item").forEach((item) => {
      item.classList.remove("thread-item--active");
      if (parseInt(item.dataset.friendId) === friendId) {
        item.classList.add("thread-item--active");
        // Remove unread badge
        item.classList.remove("thread-item--unread");
        const badge = item.querySelector(".thread-unread-badge");
        if (badge) badge.remove();
      }
    });

    // Update conversation header
    const thread = threads.find((t) => t.friendId === friendId);
    if (thread) {
      conversationName.textContent = thread.friendName;
      conversationAvatar.src =
        thread.friendProfilePicture || "../pictures/profile.png";
    }

    // Load messages
    await loadMessages(friendId);

    // Enable input
    inputField.disabled = false;
    inputField.focus();

    // Start polling for new messages
    startPolling();

    // Update navbar badge
    if (typeof window.updateMessagesBadge === "function") {
      window.updateMessagesBadge();
    }
  }

  // ----------------------------
  // 3. LOAD MESSAGES
  // ----------------------------
  async function loadMessages(friendId) {
    try {
      const response = await App.get(`/messages/threads/${friendId}`);
      messages = response.messages || [];
      renderMessages();
    } catch (error) {
      console.error("Error loading messages:", error);
      App.showError("Failed to load messages");
    }
  }

  function renderMessages() {
    chatBody.innerHTML = "";

    if (messages.length === 0) {
      chatBody.innerHTML = `
        <div class="message-empty-state">
          <p>No messages yet. Start the conversation!</p>
        </div>
      `;
      return;
    }

    messages.forEach((msg) => {
      const messageRow = createMessageRow(msg);
      chatBody.appendChild(messageRow);
    });

    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function createMessageRow(msg) {
    const currentUserId = App.currentUser?.userID;
    const isOutgoing = msg.senderID === currentUserId;
    console.log("Creating message:", {
      messageID: msg.messageID,
      senderID: msg.senderID,
      currentUserId: currentUserId,
      isOutgoing: isOutgoing,
    });
    const div = document.createElement("div");
    div.className = `message-row message-row--${
      isOutgoing ? "outgoing" : "incoming"
    }`;
    div.dataset.messageId = msg.messageID;

    const time = new Date(msg.timeStamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    div.innerHTML = `
      <div class="message-bubble">
        <p>${escapeHtml(msg.content)}</p>
        <span class="message-time">${time}</span>
      </div>
    `;

    return div;
  }

  // ----------------------------
  // 4. SEND MESSAGE
  // ----------------------------
  async function sendMessage() {
    const text = inputField.value.trim();
    if (text === "" || !currentFriendId) return;

    try {
      const response = await App.post(
        `/messages/threads/${currentFriendId}/messages`,
        {
          content: text,
        }
      );

      // Add message to local state and UI
      messages.push(response.message);
      const messageRow = createMessageRow(response.message);
      chatBody.appendChild(messageRow);

      // Clear input
      inputField.value = "";

      // Scroll to bottom
      chatBody.scrollTop = chatBody.scrollHeight;

      // Update thread list (move to top, update last message)
      await loadThreads();
    } catch (error) {
      console.error("Error sending message:", error);
      App.showError("Failed to send message");
    }
  }

  // ----------------------------
  // 5. EVENT LISTENERS
  // ----------------------------
  function setupEventListeners() {
    // Send on button click
    sendBtn.addEventListener("click", sendMessage);

    // Send on Enter key
    inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // ----------------------------
  // 6. REAL-TIME POLLING
  // ----------------------------
  function startPolling() {
    // Clear existing interval
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    // Poll every 3 seconds for new messages
    pollInterval = setInterval(async () => {
      if (!currentFriendId) return;

      try {
        const response = await App.get(`/messages/threads/${currentFriendId}`);
        const newMessages = response.messages || [];

        // Check if there are new messages
        if (newMessages.length > messages.length) {
          // Add only the new messages
          const newOnes = newMessages.slice(messages.length);
          newOnes.forEach((msg) => {
            messages.push(msg);
            const messageRow = createMessageRow(msg);
            chatBody.appendChild(messageRow);
          });

          // Scroll to bottom
          chatBody.scrollTop = chatBody.scrollHeight;

          // Update thread list
          await loadThreads();

          // Update navbar badge
          if (typeof window.updateMessagesBadge === "function") {
            window.updateMessagesBadge();
          }
        }
      } catch (error) {
        console.error("Error polling for new messages:", error);
      }
    }, 3000);
  }

  // ----------------------------
  // 7. UTILITY FUNCTIONS
  // ----------------------------
  function getTimeAgo(date) {
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
        return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }
    return "just now";
  }

  function truncate(str, length) {
    if (str.length <= length) return str;
    return str.substring(0, length) + "...";
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  });
});

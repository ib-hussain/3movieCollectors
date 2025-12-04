document.addEventListener("DOMContentLoaded", () => {

    const layout = document.getElementById("messagesLayout");
    const threads = document.querySelectorAll(".thread-item");
    const inputField = document.querySelector(".conversation-input");
    const sendBtn = document.querySelector(".conversation-send-btn");
    const chatBody = document.querySelector(".conversation-body");

    // highlight correct page in sidebar
    document.body.dataset.currentPage = "messages";

    // ----------------------------
    // 1. OPEN A CONVERSATION
    // ----------------------------
    threads.forEach(thread => {
        thread.addEventListener("click", () => {

            layout.classList.remove("messages-layout--empty");
            layout.classList.add("messages-layout--active");

            threads.forEach(t => t.classList.remove("thread-item--active"));
            thread.classList.add("thread-item--active");

            // remove unread badge
            thread.classList.remove("thread-item--unread");
            const badge = thread.querySelector(".thread-unread-badge");
            if (badge) badge.remove();

            // enable typing
            inputField.disabled = false;
            inputField.focus();
        });
    });

    // ----------------------------
    // 2. SEND A NEW MESSAGE
    // ----------------------------
    function sendMessage() {
        const text = inputField.value.trim();
        if (text === "") return;

        // create bubble
        const bubble = document.createElement("div");
        bubble.className = "message-row message-row--outgoing";
        bubble.innerHTML = `
            <div class="message-bubble">
                <p>${text}</p>
                <span class="message-time">${new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}</span>
            </div>
        `;

        chatBody.appendChild(bubble);

        // clear input
        inputField.value = "";

        // auto-scroll to bottom
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // send on button click
    sendBtn.addEventListener("click", sendMessage);

    // send on Enter key
    inputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });

});

document.addEventListener("DOMContentLoaded", () => {

    const layout = document.getElementById("messagesLayout");
    const threads = document.querySelectorAll(".thread-item");
    const inputField = document.querySelector(".conversation-input");
    const emptyPanel = document.querySelector(".conversation-panel--empty");
    const activePanel = document.querySelector(".conversation-panel--active");

    // highlight correct page in sidebar
    document.body.dataset.currentPage = "messages";

    threads.forEach(thread => {
        thread.addEventListener("click", () => {

            // switch layout
            layout.classList.remove("messages-layout--empty");
            layout.classList.add("messages-layout--active");

            // highlight selected thread
            threads.forEach(t => t.classList.remove("thread-item--active"));
            thread.classList.add("thread-item--active");

            // mark as read — remove unread badge
            thread.classList.remove("thread-item--unread");
            const badge = thread.querySelector(".thread-unread-badge");
            if (badge) badge.remove();

            // enable input & focus
            inputField.disabled = false;
            inputField.focus();
        });
    });

});

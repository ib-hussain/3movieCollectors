document.addEventListener("DOMContentLoaded", () => {
    const layout = document.getElementById("messagesLayout");
    const threads = document.querySelectorAll(".thread-item");

    // Highlight "Messages" in the side panel if your side-panel.js uses data-page,
    // otherwise this just safely does nothing.
    document.body.dataset.currentPage = "messages";

    threads.forEach(thread => {
        thread.addEventListener("click", () => {
            // Switch from empty state to active conversation view
            layout.classList.remove("messages-layout--empty");
            layout.classList.add("messages-layout--active");

            threads.forEach(t => t.classList.remove("thread-item--active"));
            thread.classList.add("thread-item--active");
        });
    });
});

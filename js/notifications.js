document.addEventListener("DOMContentLoaded", () => {

    const tabs = document.querySelectorAll(".notifications-tab");
    const items = document.querySelectorAll(".notification-item");
    const unreadCount = document.getElementById("unreadCount");
    const unreadTabCount = document.getElementById("unreadTabCount");
    const allCount = document.getElementById("allCount");
    const markAllBtn = document.querySelector(".mark-all-read-btn");

    function updateCounts() {
        const unread = [...items].filter(i => i.dataset.status === "unread").length;
        unreadCount.textContent = unread;
        unreadTabCount.textContent = unread;
        allCount.textContent = items.length;
    }

    function applyFilter(tab) {
        items.forEach(item => {
            if (tab === "unread" && item.dataset.status === "read") {
                item.style.display = "none";
            } else {
                item.style.display = "flex";
            }
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("notifications-tab--active"));
            tab.classList.add("notifications-tab--active");
            applyFilter(tab.dataset.tab);
        });
    });

    items.forEach(item => {
        item.addEventListener("click", () => {
            const newState = item.dataset.status === "unread" ? "read" : "unread";
            item.dataset.status = newState;
            updateCounts();
        });
    });

    if (markAllBtn) {
        markAllBtn.addEventListener("click", () => {
            items.forEach(i => i.dataset.status = "read");
            updateCounts();
        });
    }

    updateCounts();
});

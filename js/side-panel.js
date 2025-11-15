// Simple collapse / expand for the sidebar
document.addEventListener("DOMContentLoaded", () => {
    const layout = document.querySelector(".app-layout");
    const menuButtons = document.querySelectorAll(".menu-btn");

    if (!layout || !menuButtons.length) return;

    menuButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            layout.classList.toggle("layout-collapsed");
        });
    });
});

/*
TODO (Node.js + MySQL integration ideas):
- Use current route to highlight active menu-item.
- Load unread message count for the "Messages" badge from /api/messages/unread.
- Load upcoming events count from /api/events/upcoming.
*/

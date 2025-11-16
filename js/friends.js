// Minimal JS: tab switching only

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".friends-tab");
    const panels = document.querySelectorAll(".friends-tab-panel");

    function activateTab(targetId) {
        tabs.forEach(tab => {
            const isActive = tab.dataset.tab === targetId;
            tab.classList.toggle("friends-tab--active", isActive);
            tab.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        panels.forEach(panel => {
            const isActive = panel.id === targetId;
            panel.classList.toggle("friends-tab-panel--active", isActive);
            panel.classList.toggle("friends-tab-panel--hidden", !isActive);
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetId = tab.dataset.tab;
            if (!targetId) return;
            activateTab(targetId);
        });
    });
});

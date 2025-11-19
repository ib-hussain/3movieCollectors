// events.js
// Tab switching for Events page

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".events-tab");
    const panels = document.querySelectorAll(".events-tab-panel");

    if (!tabs.length || !panels.length) return;

    function activateEventsTab(targetId) {
        // Tabs
        tabs.forEach(tab => {
            const isActive = tab.dataset.tab === targetId;
            tab.classList.toggle("events-tab--active", isActive);
            tab.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        // Panels
        panels.forEach(panel => {
            const isActive = panel.id === targetId;
            panel.classList.toggle("events-tab-panel--active", isActive);
            panel.classList.toggle("events-tab-panel--hidden", !isActive);
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetId = tab.dataset.tab;
            if (!targetId) return;
            activateEventsTab(targetId);
        });
    });
});

// friends.js
// Tab switching + simple search filter (All Friends tab)

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".friends-tab");
    const panels = document.querySelectorAll(".friends-tab-panel");
    const searchInput = document.querySelector(".friends-search input");

    if (!tabs.length || !panels.length) return;

    /* -----------------------------
       TAB SWITCHING
    ----------------------------- */
    function activateTab(targetId) {
        // Toggle tab active state + ARIA
        tabs.forEach(tab => {
            const isActive = tab.dataset.tab === targetId;
            tab.classList.toggle("friends-tab--active", isActive);
            tab.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        // Toggle panels
        panels.forEach(panel => {
            const isActive = panel.id === targetId;
            panel.classList.toggle("friends-tab-panel--active", isActive);
            panel.classList.toggle("friends-tab-panel--hidden", !isActive);
        });

        // When switching away from "All" tab, clear search + reset visibility
        if (searchInput) {
            if (targetId !== "tab-all") {
                searchInput.value = "";
                resetFilter();
            } else {
                // reapply filter if user had text (e.g., coming back to All)
                filterFriends(searchInput.value || "");
            }
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetId = tab.dataset.tab;
            if (!targetId) return;
            activateTab(targetId);
        });
    });

    /* -----------------------------
       SEARCH FILTER (All Friends)
       Filters cards in the active panel
    ----------------------------- */
    function filterFriends(query) {
        const activePanel = document.querySelector(
            ".friends-tab-panel.friends-tab-panel--active"
        );
        if (!activePanel) return;

        const cards = activePanel.querySelectorAll(".friend-card");
        const q = (query || "").trim().toLowerCase();

        cards.forEach(card => {
            if (!q) {
                card.style.display = "";
                return;
            }

            const text = card.innerText.toLowerCase();
            card.style.display = text.includes(q) ? "" : "none";
        });
    }

    function resetFilter() {
        const activePanel = document.querySelector(
            ".friends-tab-panel.friends-tab-panel--active"
        );
        if (!activePanel) return;

        const cards = activePanel.querySelectorAll(".friend-card");
        cards.forEach(card => {
            card.style.display = "";
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const value = e.target.value;
            filterFriends(value);
        });
    }
});

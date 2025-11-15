document.addEventListener("DOMContentLoaded", () => {
    /* ===== Sidebar open/close ===== */
    const sidebar = document.getElementById("mainSidebar");
    const toggleBtn = document.getElementById("sidebarToggleBtn");

    if (sidebar && toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("sidebar--collapsed");
        });
    }

    /* ===== Trending / Recommended tabs ===== */
    const tabs = document.querySelectorAll(".trending-tab");
    const trendingList = document.getElementById("trendingList");
    const recommendedList = document.getElementById("recommendedList");

    if (tabs.length && trendingList && recommendedList) {
        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const target = tab.getAttribute("data-tab");

                tabs.forEach(t => t.classList.remove("trending-tab--active"));
                tab.classList.add("trending-tab--active");

                if (target === "trending") {
                    trendingList.classList.remove("trending-list--hidden");
                    recommendedList.classList.add("trending-list--hidden");
                } else {
                    recommendedList.classList.remove("trending-list--hidden");
                    trendingList.classList.add("trending-list--hidden");
                }
            });
        });
    }
});

/*
TODO (Node.js + MySQL ideas):
- Replace hard-coded stats, feed, and trending lists with data from API routes.
- Dynamically inject poster images into .trending-thumb via background-image.
*/

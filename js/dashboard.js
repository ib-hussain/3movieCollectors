document.addEventListener("DOMContentLoaded", () => {
    // Trending tab switching
    const tabs = document.querySelectorAll(".trending-tab");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("trending-tab--active"));
            tab.classList.add("trending-tab--active");

            const showTrending = tab.dataset.tab === "trending";

            document.getElementById("trendingList").classList.toggle("trending-list--hidden", !showTrending);
            document.getElementById("recommendedList").classList.toggle("trending-list--hidden", showTrending);
        });
    });
});

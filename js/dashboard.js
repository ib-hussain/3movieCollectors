document.addEventListener("DOMContentLoaded", () => {

    /* Trending Tabs */
    const tabs = document.querySelectorAll(".trending-tab");
    const trendingList = document.getElementById("trendingList");
    const recommendedList = document.getElementById("recommendedList");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;

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

});

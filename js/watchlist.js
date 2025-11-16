document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".watchlist-tab");
    const cards = document.querySelectorAll(".watch-card");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const filter = tab.getAttribute("data-filter");

            // activate tab
            tabs.forEach(t => t.classList.remove("watchlist-tab--active"));
            tab.classList.add("watchlist-tab--active");

            // filter cards
            cards.forEach(card => {
                const status = card.getAttribute("data-status");

                if (filter === "all" || status === filter) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

    // sort select is just a stub for now; you can hook it to Node/MySQL later
    const sortSelect = document.getElementById("watchlistSort");
    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            // placeholder for future logic
            // console.log("Sort by:", sortSelect.value);
        });
    }
});

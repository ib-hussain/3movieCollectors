// watchlist.js
// Simple client-side filtering for the watchlist chips

document.addEventListener("DOMContentLoaded", () => {
    const filterChips = document.querySelectorAll(".filter-chip");
    const cards = document.querySelectorAll(".movie-card");

    if (!filterChips.length || !cards.length) return;

    filterChips.forEach(chip => {
        chip.addEventListener("click", () => {
            // set active chip
            filterChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            const filter = chip.dataset.filter; // all | want | watching | completed

            cards.forEach(card => {
                const status = card.dataset.status;
                if (filter === "all" || status === filter) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });
});

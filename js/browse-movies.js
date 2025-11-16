document.addEventListener("DOMContentLoaded", () => {
    const chips = document.querySelectorAll(".genre-chips .chip");
    const resetBtn = document.querySelector(".filters-reset");

    // Just visual active state (no actual filtering yet)
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("chip--active"));
            chip.classList.add("chip--active");
        });
    });

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("chip--active"));
            const allChip = document.querySelector('.chip[data-genre="all"]');
            if (allChip) allChip.classList.add("chip--active");
            // later: also reset real filters
        });
    }
});

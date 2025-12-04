// PROFILE PAGE SCRIPT
document.addEventListener("DOMContentLoaded", () => {

    const tabButtons  = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    // Highlight correct page in sidebar (if side panel uses data-page)
    document.body.dataset.currentPage = "profile";

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {

            // Deactivate all buttons
            tabButtons.forEach(b => b.classList.remove("active"));

            // Activate current
            btn.classList.add("active");

            const target = btn.getAttribute("data-tab");

            // Hide all content
            tabContents.forEach(c => c.classList.remove("active"));

            // Show correct tab
            const targetEl = document.querySelector(`#tab-${target}`);
            if (targetEl) targetEl.classList.add("active");
        });
    });

});

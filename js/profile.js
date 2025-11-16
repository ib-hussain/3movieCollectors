// PROFILE PAGE SCRIPT
document.addEventListener("DOMContentLoaded", () => {

    /* ------------------------------
       TAB SWITCHING
    -------------------------------*/

    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

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
            document.querySelector(`#tab-${target}`).classList.add("active");
        });
    });

});

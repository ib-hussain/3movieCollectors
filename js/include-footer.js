document.addEventListener("DOMContentLoaded", () => {
    fetch("../components/main-footer.html")
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("beforeend", html);

            // After footer is in the DOM, align it with sidebar (if present)
            updateFooterMargin();
        });
});

// Function to update footer margin based on sidebar state
function updateFooterMargin() {
    const panel = document.querySelector(".side-panel");
    const footer = document.querySelector(".footer");

    if (panel && footer) {
        const isCollapsed = panel.classList.contains("collapsed");
        const width = isCollapsed ? 78 : 260; // must match side-panel.css

        footer.style.marginLeft = width + "px";
    }
}
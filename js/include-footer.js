document.addEventListener("DOMContentLoaded", () => {
    fetch("../components/main-footer.html")
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("beforeend", html);

            // After footer is in the DOM, align it with sidebar (if present)
            const sidebar = document.querySelector(".sidebar");
            const footer = document.querySelector(".footer");

            if (sidebar && footer) {
                const isCollapsed = sidebar.classList.contains("sidebar--collapsed");
                const width = isCollapsed ? 70 : 260; // must match side-panel.css

                footer.style.marginLeft = width + "px";
            }
        });
});

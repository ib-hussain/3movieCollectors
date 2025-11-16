document.addEventListener("DOMContentLoaded", () => {
    fetch("../components/side-panel.html")
        .then(res => res.text())
        .then(html => {
            const target = document.getElementById("sidepanel-container");
            if (!target) return;

            target.innerHTML = html;

            const sidebar = document.querySelector(".sidebar");
            const toggleBtn = document.querySelector("#sidebar-toggle");

            // --- layout handling (your working logic, improved for footer) ---
            function updateLayout() {
                if (!sidebar) return;

                const isCollapsed = sidebar.classList.contains("sidebar--collapsed");
                const width = isCollapsed ? 70 : 260;

                const content = document.querySelector(".content-area");
                const footer = document.querySelector(".footer");

                // Account for navbar height (68px) + sidebar width
                if (content) {
                    content.style.marginLeft = width + "px";
                    content.style.marginTop = "68px";
                }
                if (footer) {
                    // use padding-left so footer background stays full width
                    footer.style.paddingLeft = width + "px";
                }
            }

            // --- active menu highlighting ---
            function highlightActiveMenu() {
                if (!sidebar) return;

                const currentFile = window.location.pathname.split("/").pop(); // e.g. "browse-movies.html"
                const items = sidebar.querySelectorAll(".menu-item");

                items.forEach(item => {
                    // remove any existing active styling
                    item.classList.remove("menu-item--active");
                    const circle = item.querySelector(".icon-circle");
                    if (circle) circle.classList.remove("icon-circle--active");

                    const href = item.getAttribute("href");
                    if (!href || href === "#") return;

                    const targetFile = href.split("/").pop();
                    if (targetFile === currentFile) {
                        item.classList.add("menu-item--active");
                        if (circle) circle.classList.add("icon-circle--active");
                    }
                });
            }

            // Initial layout + active state
            updateLayout();
            highlightActiveMenu();

            // Toggle collapse / expand
            if (toggleBtn) {
                toggleBtn.addEventListener("click", () => {
                    sidebar.classList.toggle("sidebar--collapsed");
                    updateLayout(); // active item stays the same, just reflow layout
                });
            }
        });
});

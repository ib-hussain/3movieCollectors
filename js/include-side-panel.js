document.addEventListener("DOMContentLoaded", () => {
    fetch("../components/side-panel.html")
        .then(res => res.text())
        .then(html => {
            const target = document.getElementById("sidepanel-container");
            if (!target) return;

            target.innerHTML = html;

            const sidebar = document.querySelector(".sidebar");
            const toggleBtn = document.querySelector("#sidebar-toggle");

            // Single source of truth for layout
            function updateLayout() {
                if (!sidebar) return;

                const isCollapsed = sidebar.classList.contains("sidebar--collapsed");
                // match side-panel.css: .sidebar { width: 260px } / .sidebar--collapsed { width: 70px }
                const width = isCollapsed ? 70 : 260;

                const content = document.querySelector(".content-area");
                const footer = document.querySelector(".footer");

                if (content) content.style.marginLeft = width + "px";
                if (footer) footer.style.marginLeft = width + "px";
            }

            // Initial layout (in case sidebar loads after content/footer)
            updateLayout();

            if (toggleBtn) {
                toggleBtn.addEventListener("click", () => {
                    sidebar.classList.toggle("sidebar--collapsed");
                    updateLayout();
                });
            }
        });
});

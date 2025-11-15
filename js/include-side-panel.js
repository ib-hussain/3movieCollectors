document.addEventListener("DOMContentLoaded", () => {
    fetch("../components/side-panel.html")
        .then(res => res.text())
        .then(html => {
            const target = document.getElementById("sidepanel-container");
            if (!target) return;

            target.innerHTML = html;

            const sidebar = document.querySelector(".sidebar");
            const toggleBtn = document.querySelector("#sidebar-toggle");
            const content = document.querySelector(".content-area");
            const footer = document.querySelector(".footer"); // main-footer.html uses class="footer"

            function updateLayout() {
                const isCollapsed = sidebar.classList.contains("sidebar--collapsed");
                const width = isCollapsed ? 70 : 250; // match your sidebar.css widths

                if (content) content.style.marginLeft = width + "px";
                if (footer) footer.style.marginLeft = width + "px";
            }

            // initial
            updateLayout();

            if (toggleBtn) {
                toggleBtn.addEventListener("click", () => {
                    sidebar.classList.toggle("sidebar--collapsed");
                    updateLayout();
                });
            }
        });
});

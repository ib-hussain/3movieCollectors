document.addEventListener("DOMContentLoaded", () => {

    fetch("../components/side-panel.html")
        .then(res => res.text())
        .then(html => {

            const layout = document.querySelector(".layout-wrapper");

            if (!layout) {
                console.error("layout-wrapper not found. Make sure it exists before this script runs.");
                return;
            }

            // Insert sidebar INSIDE layout-wrapper
            layout.insertAdjacentHTML("afterbegin", html);

            // Enable toggle
            const sidebar = document.getElementById("sidebar");
            const toggle = document.getElementById("sidebar-toggle");

            toggle.addEventListener("click", () => {
                sidebar.classList.toggle("sidebar--collapsed");
            });
        });

});

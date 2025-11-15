document.addEventListener("DOMContentLoaded", () => {
    fetch("../components/side-panel-collapsed.html")
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("afterbegin", html);

            const sidebar = document.getElementById("sidebar");
            const toggle = document.getElementById("sidebar-toggle");

            toggle.addEventListener("click", () => {
                sidebar.classList.toggle("sidebar--collapsed");
            });
        });
});

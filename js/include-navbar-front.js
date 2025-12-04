document.addEventListener("DOMContentLoaded", () => {
    loadNavbar();
});

/* ===========================================
   Load Navbar HTML
=========================================== */
function loadNavbar() {
    fetch("../components/navbar-front.html")
        .then(res => res.text())
        .then(html => {
            const container = document.getElementById("navbar-container");

            if (container) {
                container.innerHTML = html;
            } else {
                document.body.insertAdjacentHTML("afterbegin", html);
            }

            setActiveNavbarItem();
        })
        .catch(err => console.error("Navbar failed to load:", err));
}

document.addEventListener("DOMContentLoaded", () => {
    fetch("../components/main-navbar.html")
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("afterbegin", html);
        });
});

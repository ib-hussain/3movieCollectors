document.addEventListener("DOMContentLoaded", () => {
    fetch("../components/navbar-front.html")
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("afterbegin", html);
        });
});

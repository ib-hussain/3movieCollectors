document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();
});

/* ===========================================
   Load Navbar HTML
=========================================== */
function loadNavbar() {
  fetch("../components/navbar-front.html")
    .then((res) => res.text())
    .then((html) => {
      const container = document.getElementById("navbar-container");

      if (container) {
        container.innerHTML = html;
      } else {
        document.body.insertAdjacentHTML("afterbegin", html);
      }

      setActiveNavbarItem();
    })
    .catch((err) => console.error("Navbar failed to load:", err));
}

/* ===========================================
   Set Active Navbar Item
=========================================== */
function setActiveNavbarItem() {
  // This function can be used to highlight the active page in the navbar
  // For the landing page, no specific highlighting is needed
  const currentPage = document.body.getAttribute("data-page");
  if (currentPage) {
    const navLinks = document.querySelectorAll(".navbar a");
    navLinks.forEach((link) => {
      if (link.getAttribute("data-page") === currentPage) {
        link.classList.add("active");
      }
    });
  }
}

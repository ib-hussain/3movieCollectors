document.addEventListener("DOMContentLoaded", () => {
    
    const form = document.getElementById("loginForm");

    // PASSWORD TOGGLE
    const passwordField = document.getElementById("password");
    const toggleEye = document.getElementById("togglePassword");

    let isVisible = false;

    toggleEye.addEventListener("click", () => {
        isVisible = !isVisible;

        // Toggle password visibility
        passwordField.type = isVisible ? "text" : "password";

        // Change icons
        toggleEye.src = isVisible 
            ? "../pictures/eye-closed.png"
            : "../pictures/eye.png";
    });

    // TEMPORARY BYPASS LOGIN
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const pass = passwordField.value.trim();

        if (!email || !pass) {
            alert("Please enter both email and password.");
            return;
        }

        window.location.href = "dashboard.html";
    });
});

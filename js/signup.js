document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("signupForm");

    // ALL password fields
    const toggles = document.querySelectorAll(".toggle-eye");

    toggles.forEach(toggle => {
        toggle.addEventListener("click", () => {
            const targetId = toggle.getAttribute("data-toggle");
            const field = document.getElementById(targetId);
            const isVisible = field.type === "text";

            // Toggle type
            field.type = isVisible ? "password" : "text";

            // Toggle icons
            toggle.src = isVisible 
                ? "../pictures/eye.png"
                : "../pictures/eye-closed.png";
        });
    });

    // SUBMIT (temporary bypass)
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const pass = document.getElementById("password").value.trim();
        const confirm = document.getElementById("confirmPassword").value.trim();
        const tos = document.getElementById("tos").checked;

        if (!name || !email || !pass || !confirm) {
            alert("Please fill out all fields.");
            return;
        }

        if (pass !== confirm) {
            alert("Passwords do not match!");
            return;
        }

        if (!tos) {
            alert("You must agree to the terms before creating an account.");
            return;
        }

        // TEMPORARY BYPASS
        window.location.href = "dashboard.html";
    });

});

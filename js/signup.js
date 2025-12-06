/**
 * Signup Page - Using global App utilities
 */

// Page initializer
window.initPage = window.initPage || {};
window.initPage.signup = async function () {
  const form = document.getElementById("signupForm");
  const submitBtn = form.querySelector('button[type="submit"]');

  // ALL password fields toggle
  const toggles = document.querySelectorAll(".toggle-eye");

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const targetId = toggle.getAttribute("data-toggle");
      const field = document.getElementById(targetId);
      const isVisible = field.type === "text";

      field.type = isVisible ? "password" : "text";
      toggle.src = isVisible
        ? "../pictures/eye.png"
        : "../pictures/eye-closed.png";
    });
  });

  // Show loading state
  function setLoading(loading) {
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating Account...";
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Account";
    }
  }

  // SIGNUP HANDLER
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    // Generate username from email (part before @)
    const username = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    const pass = document.getElementById("password").value.trim();
    const confirm = document.getElementById("confirmPassword").value.trim();

    // Validation
    if (!name || !email || !pass || !confirm) {
      App.showError("Please fill out all fields.");
      return;
    }

    if (pass !== confirm) {
      App.showError("Passwords do not match!");
      return;
    }

    if (pass.length < 6) {
      App.showError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const data = await App.post("/auth/signup", {
        username: username,
        name: name,
        email: email,
        password: pass,
      });

      if (data.success) {
        App.showSuccess(
          "Account created successfully! Redirecting to dashboard..."
        );
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      }
    } catch (error) {
      // Handle validation errors
      if (error.message.includes("validation")) {
        App.showError("Please check your input and try again.");
      } else {
        App.showError(error.message || "Signup failed. Please try again.");
      }
      setLoading(false);
    }
  });

  console.log("[Signup] Page initialized");
};

/**
 * Login Page - Using global App utilities
 */

// Page initializer
window.initPage = window.initPage || {};
window.initPage.login = async function () {
  const form = document.getElementById("loginForm");
  const passwordField = document.getElementById("password");
  const toggleEye = document.getElementById("togglePassword");
  const submitBtn = form.querySelector('button[type="submit"]');

  let isVisible = false;

  // PASSWORD TOGGLE
  toggleEye.addEventListener("click", () => {
    isVisible = !isVisible;
    passwordField.type = isVisible ? "text" : "password";
    toggleEye.src = isVisible
      ? "../pictures/eye-closed.png"
      : "../pictures/eye.png";
  });

  // Show loading state
  function setLoading(loading) {
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Logging in...";
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = "Log in";
    }
  }

  // LOGIN HANDLER
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const pass = passwordField.value.trim();

    if (!email || !pass) {
      App.showError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const data = await App.post("/auth/login", {
        email: email,
        password: pass,
      });

      if (data.success) {
        App.showSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 500);
      }
    } catch (error) {
      App.showError(error.message || "Login failed. Please try again.");
      setLoading(false);
    }
  });

  console.log("[Login] Page initialized");
};

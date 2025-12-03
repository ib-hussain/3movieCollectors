// settings.js
// Tab switching + password show/hide for Settings page

document.addEventListener("DOMContentLoaded", () => {
    /* ================== TAB SWITCHING ================== */
    const tabButtons = document.querySelectorAll(".settings-tab-btn");
    const tabPanels = document.querySelectorAll(".settings-tab-panel");

    tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-settings-tab");
            if (!target) return;

            // update buttons
            tabButtons.forEach((b) => b.classList.remove("settings-tab-btn--active"));
            btn.classList.add("settings-tab-btn--active");

            // update panels
            tabPanels.forEach((panel) =>
                panel.classList.remove("settings-tab-panel--active")
            );
            const activePanel = document.getElementById(`settings-panel-${target}`);
            if (activePanel) {
                activePanel.classList.add("settings-tab-panel--active");
            }
        });
    });

    /* ================== PASSWORD TOGGLE ================== */
    const passwordToggles = document.querySelectorAll(".password-toggle");

    passwordToggles.forEach((toggle) => {
        toggle.addEventListener("click", () => {
            const targetId = toggle.getAttribute("data-target");
            const input = document.getElementById(targetId);
            if (!input) return;

            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";

            // simple visual feedback
            toggle.style.opacity = isPassword ? "1" : "0.7";
        });
    });
    // APPLY PAGE WIDTH ADJUSTMENT FOR SETTINGS PAGE
const settingsMain = document.querySelector(".settings-main");
if (settingsMain) {
    if (isCollapsed) {
        settingsMain.classList.add("with-sidebar-collapsed");
        settingsMain.classList.remove("with-sidebar");
    } else {
        settingsMain.classList.add("with-sidebar");
        settingsMain.classList.remove("with-sidebar-collapsed");
    }
}

});

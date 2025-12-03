document.addEventListener("DOMContentLoaded", () => {

    /* ===========================================================
       TAB SWITCHING (Account / Security / Notifications)
    ============================================================ */
    const tabButtons = document.querySelectorAll(".settings-tab-btn");
    const tabPanels = document.querySelectorAll(".settings-tab-panel");

    if (tabButtons.length && tabPanels.length) {
        tabButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const target = btn.getAttribute("data-settings-tab");
                if (!target) return;

                // activate clicked tab
                tabButtons.forEach(b => b.classList.remove("settings-tab-btn--active"));
                btn.classList.add("settings-tab-btn--active");

                // show matching panel
                tabPanels.forEach(panel => {
                    panel.classList.remove("settings-tab-panel--active");
                });
                const activePanel = document.getElementById(`settings-panel-${target}`);
                if (activePanel) {
                    activePanel.classList.add("settings-tab-panel--active");
                }
            });
        });
    }

    /* ===========================================================
       PASSWORD FIELD ICON LOGIC (Lock → Eye Closed → Eye)
    ============================================================ */
    document.querySelectorAll(".password-field").forEach(field => {

        const input      = field.querySelector(".password-input");
        const toggle     = field.querySelector(".password-toggle");
        const lockIcon   = field.querySelector(".field-icon-left img");
        const toggleImg  = toggle ? toggle.querySelector("img") : null;

        if (!input || !toggle || !lockIcon || !toggleImg) return;

        let visible = false;

        // on focus: show eye-closed instead of lock
        input.addEventListener("focus", () => {
            lockIcon.src = "../pictures/secure-password.png";
        });

        // on blur: if empty and not visible, go back to the lock icon
        input.addEventListener("blur", () => {
            if (!input.value && !visible) {
                lockIcon.src = "../pictures/secure-password.png";
            }
        });

        // toggle visibility
        toggle.addEventListener("click", () => {
            visible = !visible;
            input.type = visible ? "text" : "password";
            toggleImg.src = visible ? "../pictures/eye-closed.png" : "../pictures/eye.png";
        });
    });

    /* ===========================================================
       SIDEBAR COLLAPSE PAGE SHIFT (Dashboard Logic Replicated)
    ============================================================ */
    const sidepanel   = document.getElementById("sidepanel-container");
    const settingsMain = document.querySelector(".settings-main");

    if (sidepanel && settingsMain) {
        const updateLayout = () => {
            if (sidepanel.classList.contains("sidebar--collapsed")) {
                settingsMain.classList.add("with-sidebar-collapsed");
                settingsMain.classList.remove("with-sidebar");
            } else {
                settingsMain.classList.add("with-sidebar");
                settingsMain.classList.remove("with-sidebar-collapsed");
            }
        };

        // initial state
        updateLayout();

        // watch for future changes
        const observer = new MutationObserver(updateLayout);
        observer.observe(sidepanel, { attributes: true, attributeFilter: ["class"] });
    }
});

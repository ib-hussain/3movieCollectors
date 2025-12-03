// help.js
// Ensures help page layout updates when sidebar collapses

document.addEventListener("DOMContentLoaded", () => {
    updateHelpLayout();
});

// Recalculate margins on sidebar toggle
function updateHelpLayout() {
    const panel = document.querySelector(".side-panel");
    const content = document.querySelector(".content-area");
    const footer = document.querySelector(".footer");

    if (!panel || !content) return;

    const isCollapsed = panel.classList.contains("collapsed");
    const width = isCollapsed ? 78 : 260;

    content.style.marginLeft = width + "px";
    if (footer) footer.style.marginLeft = width + "px";
}

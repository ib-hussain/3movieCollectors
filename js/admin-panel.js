// admin-panel.js
// Simple behaviour hooks – can grow later if you add real admin actions

document.addEventListener("DOMContentLoaded", () => {
    // Quick action logging (placeholder for future routing)
    const quickCards = document.querySelectorAll(".admin-quick-card");
    quickCards.forEach(card => {
        card.addEventListener("click", () => {
            console.log("Admin quick action:", card.innerText.trim());
        });
    });

    // Flagged buttons placeholder
    const flaggedButtons = document.querySelectorAll(".flagged-btn");
    flaggedButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            console.log("Flagged action:", btn.innerText.trim());
        });
    });
});

// SETTINGS PAGE SCRIPT

document.addEventListener("DOMContentLoaded", () => {

    const tabButtons = document.querySelectorAll(".settings-tab-btn");
    const tabContents = document.querySelectorAll(".settings-tab-content");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {

            // Deactivate all buttons
            tabButtons.forEach(b => b.classList.remove("active"));

            // Activate this button
            btn.classList.add("active");

            const target = btn.getAttribute("data-tab");

            // Hide all tab contents
            tabContents.forEach(content => content.classList.remove("active"));

            // Show the selected tab
            const activeTab = document.querySelector(`#settings-tab-${target}`);
            if (activeTab) activeTab.classList.add("active");
        });
    });

});

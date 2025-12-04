document.querySelectorAll(".overview-tabs .tab").forEach(tab => {
    tab.addEventListener("click", () => {

                document.querySelectorAll(".overview-tabs .tab")
                        .forEach(t => t.classList.remove("active"));
                tab.classList.add("active");

                const target = tab.getAttribute("data-target");

                document.querySelectorAll(".tab-content")
                        .forEach(sec => sec.classList.remove("active"));

                document.getElementById(target).classList.add("active");
            });
});
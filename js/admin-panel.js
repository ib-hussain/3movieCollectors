document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("rating-chart");
    if (!container || typeof d3 === "undefined") return;

    // Tooltip element
    const tooltip = document.createElement("div");
    tooltip.className = "chart-tooltip";
    tooltip.style.position = "absolute";
    tooltip.style.padding = "6px 10px";
    tooltip.style.fontSize = "12px";
    tooltip.style.background = "rgba(0,0,0,0.85)";
    tooltip.style.borderRadius = "6px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.color = "#fff";
    tooltip.style.opacity = 0;
    tooltip.style.transition = "opacity 0.15s";
    container.style.position = "relative";
    container.appendChild(tooltip);

    // Static data
    const data = [
        { rating: "5★", value: 52000 },
        { rating: "4★", value: 32145 },
        { rating: "3★", value: 21000 },
        { rating: "2★", value: 8421 },
        { rating: "1★", value: 4210 }
    ];

    // Render function
    function renderChart() {
        container.innerHTML = "";
        container.appendChild(tooltip);

        const w = container.clientWidth;
        const h = container.clientHeight;

        const margin = { top: 10, right: 40, bottom: 30, left: 60 };
        const width = w - margin.left - margin.right;
        const height = h - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value) * 1.1])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(data.map(d => d.rating))
            .range([0, height])
            .padding(0.25);

        const colors = ["#FFC300","#FF9F1A","#FF6F3C","#FF4A4A","#D8343A"];

        g.append("g")
         .attr("transform", `translate(0,${height})`)
         .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format(",")))
         .selectAll("text")
         .style("fill", "#aaa");

        g.append("g")
         .call(d3.axisLeft(y))
         .selectAll("text")
         .style("fill", "#ddd");

        g.selectAll("rect")
         .data(data)
         .enter()
         .append("rect")
         .attr("y", d => y(d.rating))
         .attr("height", y.bandwidth())
         .attr("x", 0)
         .attr("width", d => x(d.value))
         .attr("fill", (d, i) => colors[i])
         .on("mousemove", (event, d) => {
             tooltip.style.opacity = 1;
             tooltip.style.left = event.offsetX + 15 + "px";
             tooltip.style.top = event.offsetY - 10 + "px";
             tooltip.innerHTML = `
                <b>${d.rating}</b><br>
                ${d.value.toLocaleString()} ratings
             `;
         })
         .on("mouseleave", () => {
             tooltip.style.opacity = 0;
         });
    }

    // Initial render
    renderChart();

    // Re-render on resize
    const ro = new ResizeObserver(() => renderChart());
    ro.observe(container);
});

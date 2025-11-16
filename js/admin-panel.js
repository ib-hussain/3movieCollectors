// ADMIN DASHBOARD JS
// Q1: A (D3 is included via CDN in admin-panel.html)
// Q2: A (we render a static rating distribution chart matching the mockup)

document.addEventListener("DOMContentLoaded", () => {
    const chartContainer = document.getElementById("rating-chart");

    // If the container is missing OR D3 failed to load, safely exit.
    if (!chartContainer || typeof d3 === "undefined") {
        // NOTE:
        // If you're wiring this to a backend later, ensure D3 is loaded
        // BEFORE this script, or move this chart code into your bundler.
        return;
    }

    // --- STATIC DATA (matches the Figma screenshot idea) ---
    // Values are approximate counts for each rating bucket.
    const data = [
        { rating: "5★", value: 52000 },
        { rating: "4★", value: 38000 },
        { rating: "3★", value: 26000 },
        { rating: "2★", value: 14000 },
        { rating: "1★", value: 6000 },
    ];

    // Colors: from yellow to deep red, similar to screenshot
    const barColors = ["#FFC300", "#FF9F1A", "#FF6F3C", "#FF4A4A", "#D8343A"];

    // --- BASIC SIZING ---
    const containerWidth = chartContainer.clientWidth || 600;
    const containerHeight = chartContainer.clientHeight || 260;

    const margin = { top: 10, right: 40, bottom: 30, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Clear any previous SVG (in case of re-renders)
    chartContainer.innerHTML = "";

    const svg = d3
        .select("#rating-chart")
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight);

    const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- SCALES ---
    const x = d3
        .scaleLinear()
        .domain([0, d3.max(data, d => d.value) * 1.05])
        .range([0, width]);

    const y = d3
        .scaleBand()
        .domain(data.map(d => d.rating))
        .range([0, height])
        .padding(0.25);

    // --- AXES ---
    const xAxis = d3
        .axisBottom(x)
        .ticks(4)
        .tickFormat(d3.format(","));

    const yAxis = d3.axisLeft(y);

    // X axis
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("fill", "#aaaaaa")
        .style("font-size", "10px");

    // Y axis
    g.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .selectAll("text")
        .style("fill", "#dddddd")
        .style("font-size", "11px");

    // Light horizontal grid lines
    g.append("g")
        .attr("class", "grid-lines")
        .selectAll("line")
        .data(x.ticks(4))
        .enter()
        .append("line")
        .attr("x1", d => x(d))
        .attr("x2", d => x(d))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#252525")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,4");

    // --- BARS ---
    g.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.rating))
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", d => x(d.value))
        .attr("fill", (d, i) => barColors[i]);

    // Optional labels at end of bars
    g.selectAll(".bar-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => x(d.value) + 4)
        .attr("y", d => y(d.rating) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .style("fill", "#f5f5f5")
        .style("font-size", "10px")
        .text(d => d3.format(",")(d.value));

    // --- NOTE FOR FUTURE DB INTEGRATION ---
    //
    // To hook this up to real backend data later:
    // 1. Replace the static `data` array above with a fetch call or
    //    values embedded via templating.
    // 2. Ensure that each entry has shape: { rating: "5★", value: number }.
    // 3. Call a separate function (e.g., renderRatingChart(data)) that
    //    contains everything from the "BASIC SIZING" section downward.
    //
    // This keeps the D3 rendering logic stable while your data source changes.
});
    
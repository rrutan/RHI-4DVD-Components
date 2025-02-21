import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./TimeSeriesChart.css"; // Import CSS file

const TimeSeriesChart = ({ data }) => {
  const chartRef = useRef();

  useEffect(() => {
    const margin = { top: 10, right: 30, bottom: 80, left: 60 },
      width = chartRef.current.clientWidth - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    d3.select(chartRef.current).select("svg").remove();

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const tooltip = d3
      .select(chartRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    const chartArea = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const parsedData = data.dates.map((date, index) => ({
      date: d3.timeParse("%Y-%m-%d")(date),
      value: data.values[index],
    }));

    const x = d3
      .scaleTime()
      .domain(d3.extent(parsedData, (d) => d.date))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(parsedData, (d) => d.value))
      .range([height, 0]);

    const xAxis = chartArea
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add the label for the x-axis
    chartArea
      .append("text")
      .attr("x", width / 2) // Position the label horizontally centered
      .attr("y", height + margin.bottom - 20) // Position the label just below the x-axis
      .style("text-anchor", "middle") // Align the text to the center
      .text("Date"); // Set the label text

    const yAxis = chartArea.append("g").call(d3.axisLeft(y));

    // Add the label for the y-axis
    chartArea
      .append("text")
      .attr("transform", "rotate(-90)") // Rotate label to be vertical
      .attr("y", -margin.left + 20) // Position it on the left
      .attr("x", -height / 2) // Center it vertically on the axis
      .style("text-anchor", "middle") // Align the text to the center
      .text("Temperature (°C)"); // Set the label text

    const gradient = svg
      .append("linearGradient")
      .attr("id", "line-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", y(d3.min(parsedData, (d) => d.value)))
      .attr("x2", 0)
      .attr("y2", y(d3.max(parsedData, (d) => d.value)));

    gradient
      .selectAll("stop")
      .data([
        { offset: "0%", color: "blue" },
        { offset: "100%", color: "red" },
      ])
      .enter()
      .append("stop")
      .attr("offset", (d) => d.offset)
      .attr("stop-color", (d) => d.color);

    // **🔹 Define Clipping Path (Restricts Drawing to Bounds)**
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    // **🔹 Apply Clipping Path to Line**
    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.value));

    const lineChart = chartArea
      .append("g")
      .attr("clip-path", "url(#clip)") // Restrict drawing to bounds
      .append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 2)
      .attr("d", line);

    const focus = svg
      .append("circle")
      .attr("r", 5)
      .attr("fill", "black")
      .style("opacity", 0);

    const hoverLine = svg
      .append("line")
      .attr("stroke", "black")
      .attr("stroke-dasharray", "4")
      .style("opacity", 0);

    const bisectDate = d3.bisector((d) => d.date).left;

    function mousemove(event) {
      const [mouseX] = d3.pointer(event);
      const x0 = x.invert(mouseX);
      const i = bisectDate(parsedData, x0, 1);
      const d0 = parsedData[i - 1];
      const d1 = parsedData[i] || d0;
      const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

      focus.attr("cx", x(d.date)).attr("cy", y(d.value)).style("opacity", 1);
      hoverLine
        .attr("x1", x(d.date))
        .attr("x2", x(d.date))
        .attr("y1", 0)
        .attr("y2", height)
        .style("opacity", 1);

      tooltip
        .style("opacity", 1)
        .html(`📅 ${d3.timeFormat("%Y-%m-%d")(d.date)}<br>🌡️ ${d.value}°C`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`);
    }

    function mouseout() {
      focus.style("opacity", 0);
      hoverLine.style("opacity", 0);
      tooltip.style("opacity", 0);
    }

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", mousemove)
      .on("mouseout", mouseout);

    // **🔹 Add Zoom Behavior (X-Axis Only)**
    const zoom = d3
      .zoom()
      .scaleExtent([1, 5]) // Allow zooming in up to 5x
      .translateExtent([
        [0, 0],
        [width, height],
      ]) // Prevent panning beyond dataset
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", (event) => {
        const newX = event.transform.rescaleX(x); // Update x-axis only
        xAxis.call(d3.axisBottom(newX)); // Redraw x-axis
        lineChart.attr(
          "d",
          d3
            .line()
            .x((d) => newX(d.date))
            .y((d) => y(d.value))
        ); // Update line
      });

    svg.call(zoom);
  }, [data]);

  return <div className="chart-container" ref={chartRef}></div>;
};

export default TimeSeriesChart;

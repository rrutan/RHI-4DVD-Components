import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Trendline from "../Trend/Trend";
import "../TS/TimeSeriesChart.css";

const MultiTS = ({
  data,
  data2,
  showTrendline = true,
  onVisibleDataChange = null,
  yAxisTitle = "Temperature (°C)",
}) => {
  const chartRef = useRef();
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const trendlineRef = useRef(null);
  const tooltipRef = useRef(null);
  const [trendlineInstance, setTrendlineInstance] = useState(null);
  const [visibleData, setVisibleData] = useState([]);

  // Store chart dimensions and elements for reuse
  const chartDimensionsRef = useRef({
    margin: { top: 10, right: 30, bottom: 80, left: 60 },
    width: 0,
    height: 0,
    chartArea: null,
    focus: null,
    hoverLine: null,
  });

  useEffect(() => {
    // Ensure we have data and data2
    if (!data || !data2 || !data.dates || !data2.dates) {
      console.error("Missing data for MultiTS chart");
      return;
    }

    const margin = { top: 10, right: 30, bottom: 80, left: 60 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Store dimensions
    chartDimensionsRef.current.margin = margin;
    chartDimensionsRef.current.width = width;
    chartDimensionsRef.current.height = height;

    // Clear previous charts and tooltips
    d3.select(chartRef.current).select("svg").remove();
    d3.select(chartRef.current).select(".tooltip").remove();

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    svgRef.current = svg;

    // Create tooltip
    const tooltip = d3
      .select(chartRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background-color", "rgba(255, 255, 255, 0.9)")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("font-size", "12px")
      .style("z-index", "10");

    tooltipRef.current = tooltip;

    const chartArea = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    chartDimensionsRef.current.chartArea = chartArea;

    // Process data
    const parsedData = data.dates.map((date, index) => ({
      date: d3.timeParse("%Y-%m-%d")(date),
      value: data.values[index],
    }));

    const parsedData2 = data2.dates.map((date, index) => ({
      date: d3.timeParse("%Y-%m-%d")(date),
      value: data2.values[index],
    }));

    console.log("Data 1:", parsedData.length, "points");
    console.log("Data 2:", parsedData2.length, "points");

    // Initial set of visible data
    setVisibleData(parsedData);
    if (onVisibleDataChange) {
      onVisibleDataChange(parsedData);
    }

    // Create scales with combined domain from both datasets
    const allDates = [
      ...parsedData.map((d) => d.date),
      ...parsedData2.map((d) => d.date),
    ];
    const x = d3.scaleTime().domain(d3.extent(allDates)).range([0, width]);

    const allValues = [
      ...parsedData.map((d) => d.value),
      ...parsedData2.map((d) => d.value),
    ];
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(allValues) * 0.95, // Add some padding
        d3.max(allValues) * 1.05,
      ])
      .nice()
      .range([height, 0]);

    const xAxis = chartArea
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    chartArea
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 20)
      .style("text-anchor", "middle")
      .text("Date");

    const yAxis = chartArea
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y));

    // Y-axis title
    chartArea
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .text(yAxisTitle);

    // Create gradient for first line
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

    // Create gradient for second line
    const gradient2 = svg
      .append("linearGradient")
      .attr("id", "line-gradient-2")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", y(d3.min(parsedData2, (d) => d.value)))
      .attr("x2", 0)
      .attr("y2", y(d3.max(parsedData2, (d) => d.value)));

    gradient2
      .selectAll("stop")
      .data([
        { offset: "0%", color: "yellow" },
        { offset: "100%", color: "pink" },
      ])
      .enter()
      .append("stop")
      .attr("offset", (d) => d.offset)
      .attr("stop-color", (d) => d.color);

    // Clipping path
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    // Create line generators
    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .defined((d) => !isNaN(d.value)); // Skip points with NaN values

    const line2 = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .defined((d) => !isNaN(d.value)); // Skip points with NaN values

    // Add first line
    const lineChart = chartArea
      .append("g")
      .attr("class", "line-group-1")
      .attr("clip-path", "url(#clip)")
      .append("path")
      .datum(parsedData)
      .attr("class", "line-1")
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add second line with gradient
    const lineChart2 = chartArea
      .append("g")
      .attr("class", "line-group-2")
      .attr("clip-path", "url(#clip)")
      .append("path")
      .datum(parsedData2)
      .attr("class", "line-2")
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient-2)") // Use the second gradient
      .attr("stroke-width", 2.5) // Slightly thicker
      .attr("d", line2);

    // Create legend with proper positioning and separate entries
    const legend = svg
      .append("g")
      .attr("class", "chart-legend")
      .attr(
        "transform",
        `translate(${width - 160}, ${height + margin.top + 40})`
      );

    // First line in legend
    legend
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 20)
      .attr("y2", 0)
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 2);

    legend
      .append("text")
      .attr("x", 25)
      .attr("y", 4)
      .text(data.title || "Location 1")
      .style("font-size", "12px");

    // Second line in legend - positioned below the first
    legend
      .append("line")
      .attr("x1", 0)
      .attr("y1", 20) // Positioned below first legend item
      .attr("x2", 20)
      .attr("y2", 20)
      .attr("stroke", "url(#line-gradient-2)") // Match the actual gradient
      .attr("stroke-width", 2.5); // Match the line thickness

    legend
      .append("text")
      .attr("x", 25)
      .attr("y", 24) // Aligned with second legend line
      .text(data2.title || "Location 2")
      .style("font-size", "12px");

    // Create hover elements
    const focus = svg
      .append("circle")
      .attr("class", "focus-circle")
      .attr("r", 5)
      .attr("fill", "black")
      .style("opacity", 0);

    const focus2 = svg
      .append("circle")
      .attr("class", "focus-circle-2")
      .attr("r", 5)
      .attr("fill", "purple") // Use a color from the middle of the gradient
      .style("opacity", 0);

    chartDimensionsRef.current.focus = focus;
    chartDimensionsRef.current.focus2 = focus2;

    const hoverLine = svg
      .append("line")
      .attr("class", "hover-line")
      .attr("stroke", "black")
      .attr("stroke-dasharray", "4")
      .attr("stroke-width", 1)
      .style("opacity", 0);

    chartDimensionsRef.current.hoverLine = hoverLine;

    // Store trendline data
    trendlineRef.current = {
      chartArea,
      parsedData,
      x,
      y,
      width,
      height,
      svg,
      legend,
    };

    // Create a container for mouse events
    const overlay = chartArea
      .append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all");

    // Define the zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([1, 50])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", handleZoom);

    // Add zoom behavior to svg
    svg.call(zoom);
    zoomRef.current = zoom;

    // Store the current visible domain
    let currentXDomain = x.domain();

    // Bisector for finding data points
    const bisectDate = d3.bisector((d) => d.date).left;

    // Function to handle zoom events
    function handleZoom(event) {
      // Get the new x scale
      const newX = event.transform.rescaleX(x);

      // Update axes
      xAxis.call(d3.axisBottom(newX));

      // Update the first line
      lineChart.attr(
        "d",
        d3
          .line()
          .x((d) => newX(d.date))
          .y((d) => y(d.value))
          .defined((d) => !isNaN(d.value))
      );

      // Update the second line
      lineChart2.attr(
        "d",
        d3
          .line()
          .x((d) => newX(d.date))
          .y((d) => y(d.value))
          .defined((d) => !isNaN(d.value))
      );

      // Store the current visible domain
      currentXDomain = newX.domain();

      // Calculate visible data
      const newVisibleData = parsedData.filter(
        (d) => d.date >= currentXDomain[0] && d.date <= currentXDomain[1]
      );

      setVisibleData(newVisibleData);

      if (onVisibleDataChange) {
        onVisibleDataChange(newVisibleData);
      }

      // Update trendline if needed
      if (showTrendline && trendlineInstance) {
        trendlineInstance.updateTrendline(newX);
      }
    }

    // Mousemove handler for tooltip
    function handleMouseMove(event) {
      // Get the current transform and scales
      const transform = d3.zoomTransform(svg.node());
      const currentX = transform.rescaleX(x);

      // Get mouse position relative to the chart
      const [mouseX] = d3.pointer(event, chartArea.node());

      // Convert to date
      const date = currentX.invert(mouseX);

      // Find nearest data point in first dataset
      const index = bisectDate(parsedData, date, 1);
      let d = null;

      // Handle edge cases
      if (index > 0 && index < parsedData.length) {
        // Get data points before and after
        const d0 = parsedData[index - 1];
        const d1 = parsedData[index];

        // Determine which point is closer
        d = date - d0.date > d1.date - date ? d1 : d0;
      }

      // Find the closest point in the second dataset
      const index2 = bisectDate(parsedData2, date, 1);
      let d2 = null;

      if (index2 > 0 && index2 < parsedData2.length) {
        const d2_0 = parsedData2[index2 - 1];
        const d2_1 = parsedData2[index2];
        d2 = date - d2_0.date > d2_1.date - date ? d2_1 : d2_0;
      }

      // If we found no points, hide tooltip
      if (!d && !d2) {
        return hideTooltip();
      }

      // Position the hover line at the current date position
      const hoverDate = d ? d.date : d2.date;

      hoverLine
        .attr("x1", currentX(hoverDate) + margin.left)
        .attr("x2", currentX(hoverDate) + margin.left)
        .attr("y1", margin.top)
        .attr("y2", height + margin.top)
        .style("opacity", 1);

      // Position focus elements for first dataset
      if (d) {
        focus
          .attr("cx", currentX(d.date))
          .attr("cy", y(d.value))
          .attr("transform", `translate(${margin.left},${margin.top})`)
          .style("opacity", 1);
      } else {
        focus.style("opacity", 0);
      }

      // Position focus elements for second dataset
      if (d2) {
        focus2
          .attr("cx", currentX(d2.date))
          .attr("cy", y(d2.value))
          .attr("transform", `translate(${margin.left},${margin.top})`)
          .style("opacity", 1);
      } else {
        focus2.style("opacity", 0);
      }

      // Build tooltip content
      let tooltipHTML = `<strong>Date:</strong> ${d3.timeFormat("%Y-%m-%d")(
        hoverDate
      )}<br>`;

      if (d) {
        tooltipHTML += `<strong>${
          data.title || "Location 1"
        }:</strong> ${d.value.toFixed(2)} ${data.units || ""}<br>`;
      }

      if (d2) {
        tooltipHTML += `<strong>${
          data2.title || "Location 2"
        }:</strong> ${d2.value.toFixed(2)} ${data2.units || ""}`;
      }

      // Update tooltip
      tooltip
        .style("opacity", 1)
        .html(tooltipHTML)
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 30}px`);
    }

    function hideTooltip() {
      focus.style("opacity", 0);
      focus2.style("opacity", 0);
      hoverLine.style("opacity", 0);
      tooltip.style("opacity", 0);
    }

    // Add mouse events
    overlay.on("mousemove", handleMouseMove).on("mouseout", hideTooltip);

    // Remove any existing trendline instance
    setTrendlineInstance(null);

    // Handle resize
    const handleResize = () => {
      // Re-render chart on resize
      const newWidth =
        chartRef.current.clientWidth - margin.left - margin.right;
      if (newWidth !== width) {
        // Call useEffect again to redraw
        svg.remove();
        tooltip.remove();
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, data2, onVisibleDataChange, yAxisTitle]);

  // Handle trendline
  useEffect(() => {
    if (!svgRef.current || !trendlineRef.current) return;

    if (showTrendline) {
      initializeTrendline();
    } else {
      removeTrendline();
    }
  }, [showTrendline, trendlineInstance]);

  // Initialize trendline
  const initializeTrendline = () => {
    if (!trendlineRef.current) return;

    removeTrendline();

    const { chartArea, parsedData, x, y, width, height, svg } =
      trendlineRef.current;

    const trendline = Trendline({
      chartArea,
      parsedData,
      xScale: x,
      yScale: y,
      width,
      height,
    });

    trendline.addTrendlineLegend(svg);

    // Get current transform to apply to trendline
    if (svgRef.current) {
      const currentTransform = d3.zoomTransform(svgRef.current.node());
      const xScale = currentTransform.rescaleX(x);
      trendline.updateTrendline(xScale);
    } else {
      trendline.updateTrendline(x);
    }

    setTrendlineInstance(trendline);
  };

  // Remove trendline
  const removeTrendline = () => {
    if (!svgRef.current) return;

    setTrendlineInstance(null);

    const container = d3.select(chartRef.current);

    // Remove all trendline-related elements
    container
      .selectAll(
        ".trendline, .trendline-legend, .trendline-equation, [class*='trendline'], .equation, .regression-equation, text.equation"
      )
      .remove();

    if (svgRef.current) {
      svgRef.current.selectAll("g.trendline-container").remove();

      // Clean up any red lines that might be trendlines
      svgRef.current.selectAll("[stroke='red']").each(function () {
        const el = d3.select(this);
        const classValue = el.attr("class") || "";
        if (
          classValue.includes("trendline") ||
          (el.attr("stroke") === "red" && el.node().tagName === "path")
        ) {
          el.remove();
        }
      });

      // Clean up equation text
      svgRef.current.selectAll("text").each(function () {
        const el = d3.select(this);
        const text = el.text() || "";
        if (text.includes("y =") || text.includes("R²")) {
          el.remove();
        }
      });
    }
  };

  return <div className="chart-container" ref={chartRef}></div>;
};

export default MultiTS;

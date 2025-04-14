import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Trendline from "../Trend/Trend";
import "./TimeSeriesChart.css";

const TimeSeriesChart = ({
  data,
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

    // Initial set of visible data
    setVisibleData(parsedData);

    // Update window.visibleTimeSeriesData for SummaryStats to access
    window.visibleTimeSeriesData = {
      dates: data.dates,
      values: data.values,
      title: data.title,
      units: data.units,
    };

    if (onVisibleDataChange) {
      onVisibleDataChange(parsedData);
    }

    // Create scales
    const x = d3
      .scaleTime()
      .domain(d3.extent(parsedData, (d) => d.date))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(parsedData, (d) => d.value))
      .nice() // Nicer axis bounds
      .range([height, 0]);

    // Create X-axis with larger tick labels
    const xAxis = chartArea
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Increase font size of X-axis tick labels
    // Re-apply larger font size and rotation to tick labels after zoom
    // Re-apply larger font size and rotation to tick labels after zoom
    xAxis
      .selectAll("text")
      .style("font-size", "14px")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    chartArea
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom)
      .style("text-anchor", "middle")
      .text("Date")
      .style("font-size", "28px");

    // Create Y-axis with larger tick labels
    const yAxis = chartArea
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y));

    // Increase font size of Y-axis tick labels
    yAxis.selectAll("text").style("font-size", "16px");

    // Y-axis title
    chartArea
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .text(yAxisTitle)
      .style("font-size", "25px");

    // Gradient
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

    // Clipping path
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    // Create line
    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.value));

    const lineChart = chartArea
      .append("g")
      .attr("class", "line-group")
      .attr("clip-path", "url(#clip)")
      .append("path")
      .datum(parsedData)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Create legend
    const legend = svg
      .append("g")
      .attr("class", "chart-legend")
      .attr("transform", `translate(${width - 50}, ${margin.top})`);

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
      .text(data.title || "Data")
      .style("font-size", "18px");

    // Create hover elements
    const focus = svg
      .append("circle")
      .attr("class", "focus-circle")
      .attr("r", 5)
      .attr("fill", "black")
      .style("opacity", 0);

    chartDimensionsRef.current.focus = focus;

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
    let currentYDomain = y.domain();

    // Bisector for finding data points
    const bisectDate = d3.bisector((d) => d.date).left;

    // Function to handle zoom events
    function handleZoom(event) {
      // Get the new x scale
      const newX = event.transform.rescaleX(x);

      // Update axes
      xAxis.call(d3.axisBottom(newX));

      // Re-apply larger font size to tick labels after zoom
      // Re-apply larger font size and rotation to tick labels after zoom
      xAxis
        .selectAll("text")
        .style("font-size", "14px")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

      // Update the line
      lineChart.attr(
        "d",
        d3
          .line()
          .x((d) => newX(d.date))
          .y((d) => y(d.value))
      );

      // Store the current visible domain
      currentXDomain = newX.domain();

      // Calculate visible data
      const newVisibleData = parsedData.filter(
        (d) => d.date >= currentXDomain[0] && d.date <= currentXDomain[1]
      );

      setVisibleData(newVisibleData);

      // KEY CHANGE: Update window.visibleTimeSeriesData for SummaryStats to access
      if (newVisibleData && newVisibleData.length > 0) {
        window.visibleTimeSeriesData = {
          dates: newVisibleData.map((d) => {
            if (d.date instanceof Date) {
              return d.date.toISOString().split("T")[0];
            }
            return d.date;
          }),
          values: newVisibleData.map((d) => d.value),
          title: data.title,
          units: data.units,
        };
      }

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

      // Find nearest data point
      const index = bisectDate(parsedData, date, 1);

      // Handle edge cases
      if (index <= 0 || index >= parsedData.length) {
        return hideTooltip();
      }

      // Get data points before and after
      const d0 = parsedData[index - 1];
      const d1 = parsedData[index];

      // Determine which point is closer
      const d = date - d0.date > d1.date - date ? d1 : d0;

      // Position focus elements
      focus
        .attr("cx", currentX(d.date))
        .attr("cy", y(d.value))
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .style("opacity", 1);

      hoverLine
        .attr("x1", currentX(d.date) + margin.left)
        .attr("x2", currentX(d.date) + margin.left)
        .attr("y1", margin.top)
        .attr("y2", height + margin.top)
        .style("opacity", 1);

      // Update tooltip
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>Date:</strong> ${d3.timeFormat("%Y-%m-%d")(d.date)}<br>
           <strong>${data.title || "Value"}:</strong> ${d.value.toFixed(2)} ${
            data.units || ""
          }`
        )
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 30}px`);
    }

    function hideTooltip() {
      focus.style("opacity", 0);
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
      // Clean up global variable on unmount
      delete window.visibleTimeSeriesData;
    };
  }, [data, onVisibleDataChange, yAxisTitle]);

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

export default TimeSeriesChart;

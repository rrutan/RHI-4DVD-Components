import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Trendline from "../Trend/Trend";
import "../TS/TimeSeriesChart.css";

const MultiTS = ({
  data,
  data2,
  showTrendline = true,
  onVisibleDataChange = null,
  onVisibleData2Change = null,
  yAxisTitle = "Temperature (°C)",
}) => {
  const chartRef = useRef();
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const trendlineRef = useRef(null);
  const tooltipRef = useRef(null);
  const [trendlineInstance, setTrendlineInstance] = useState(null);
  const [visibleData, setVisibleData] = useState([]);
  const [visibleData2, setVisibleData2] = useState([]);

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

    // Initial set of visible data for both datasets
    setVisibleData(parsedData);
    setVisibleData2(parsedData2);

    // Call callbacks if provided
    if (onVisibleDataChange) {
      onVisibleDataChange({
        ...data,
        values: parsedData.map((d) => d.value),
        dates: parsedData.map((d) => d3.timeFormat("%Y-%m-%d")(d.date)),
      });
    }

    if (onVisibleData2Change) {
      onVisibleData2Change({
        ...data2,
        values: parsedData2.map((d) => d.value),
        dates: parsedData2.map((d) => d3.timeFormat("%Y-%m-%d")(d.date)),
      });
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

    // Create X-axis with larger tick labels
    const xAxis = chartArea
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Increase font size of X-axis tick labels and rotate
    xAxis
      .selectAll("text")
      .style("font-size", "14px")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // X-axis title
    chartArea
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom)
      .attr("class", "axis-title")
      .style("text-anchor", "middle")
      .style("font-size", "28px")
      .style("font-weight", "bold")
      .text("Date");

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
      .attr("class", "axis-title")
      .style("text-anchor", "middle")
      .style("font-size", "25px")
      .style("font-weight", "bold")
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

    // Add first line with increased thickness
    const lineChart = chartArea
      .append("g")
      .attr("class", "line-group-1")
      .attr("clip-path", "url(#clip)")
      .append("path")
      .datum(parsedData)
      .attr("class", "line-1")
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 2.5)
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
      .attr("stroke", "url(#line-gradient-2)")
      .attr("stroke-width", 2.5)
      .attr("d", line2);

    // Create legend with proper positioning and separate entries
    const legend = svg
      .append("g")
      .attr("class", "chart-legend")
      .attr("transform", `translate(${width - 160}, ${margin.top})`);

    // First line in legend
    legend
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 20)
      .attr("y2", 0)
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 2.5);

    legend
      .append("text")
      .attr("x", 25)
      .attr("y", 4)
      .text("Yuma, CA")
      .style("font-size", "18px");

    // Second line in legend - positioned below the first
    legend
      .append("line")
      .attr("x1", 0)
      .attr("y1", 25) // Increased spacing
      .attr("x2", 20)
      .attr("y2", 25)
      .attr("stroke", "url(#line-gradient-2)")
      .attr("stroke-width", 2.5);

    legend
      .append("text")
      .attr("x", 25)
      .attr("y", 29) // Aligned with second legend line
      .text("Bombay Beach, CA")
      .style("font-size", "18px");

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

    // Bisector for finding data points
    const bisectDate = d3.bisector((d) => d.date).left;

    // Function to handle zoom events
    function handleZoom(event) {
      // Get the new x scale
      const newX = event.transform.rescaleX(x);

      // Update axes
      xAxis.call(d3.axisBottom(newX));

      // Reapply font size and rotation to x-axis labels after zoom
      xAxis
        .selectAll("text")
        .style("font-size", "14px")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

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
      const currentXDomain = newX.domain();

      // Calculate visible data for both datasets
      const newVisibleData = parsedData.filter(
        (d) => d.date >= currentXDomain[0] && d.date <= currentXDomain[1]
      );

      const newVisibleData2 = parsedData2.filter(
        (d) => d.date >= currentXDomain[0] && d.date <= currentXDomain[1]
      );

      setVisibleData(newVisibleData);
      setVisibleData2(newVisibleData2);

      // Update window variables for SummaryStats
      window.visibleTimeSeriesData = {
        ...data,
        dates: newVisibleData.map((d) => d3.timeFormat("%Y-%m-%d")(d.date)),
        values: newVisibleData.map((d) => d.value),
      };

      window.visibleTimeSeriesData2 = {
        ...data2,
        dates: newVisibleData2.map((d) => d3.timeFormat("%Y-%m-%d")(d.date)),
        values: newVisibleData2.map((d) => d.value),
      };

      // Call callbacks with the formatted data for SummaryStats component
      if (onVisibleDataChange) {
        onVisibleDataChange({
          ...data,
          values: newVisibleData.map((d) => d.value),
          dates: newVisibleData.map((d) => d3.timeFormat("%Y-%m-%d")(d.date)),
        });
      }

      if (onVisibleData2Change) {
        onVisibleData2Change({
          ...data2,
          values: newVisibleData2.map((d) => d.value),
          dates: newVisibleData2.map((d) => d3.timeFormat("%Y-%m-%d")(d.date)),
        });
      }

      // Update trendline if needed
      if (showTrendline && trendlineInstance) {
        trendlineInstance.updateTrendline(newX);
      }
    }

    // Function to hide tooltip and focus elements
    function hideTooltip() {
      focus.style("opacity", 0);
      focus2.style("opacity", 0);
      hoverLine.style("opacity", 0);
      tooltip.style("opacity", 0);
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
      } else if (index === parsedData.length && parsedData.length > 0) {
        d = parsedData[index - 1];
      } else if (index === 0 && parsedData.length > 0) {
        d = parsedData[0];
      }

      // Find the closest point in the second dataset
      const index2 = bisectDate(parsedData2, date, 1);
      let d2 = null;

      if (index2 > 0 && index2 < parsedData2.length) {
        const d2_0 = parsedData2[index2 - 1];
        const d2_1 = parsedData2[index2];
        d2 = date - d2_0.date > d2_1.date - date ? d2_1 : d2_0;
      } else if (index2 === parsedData2.length && parsedData2.length > 0) {
        d2 = parsedData2[index2 - 1];
      } else if (index2 === 0 && parsedData2.length > 0) {
        d2 = parsedData2[0];
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
        tooltipHTML += `<strong>Yuma, CA:</strong> ${d.value.toFixed(2)} ${
          data.units || ""
        }<br>`;
      }

      if (d2) {
        tooltipHTML += `<strong>Bombay Beach, CA:</strong> ${d2.value.toFixed(
          2
        )} ${data2.units || ""}`;
      }

      // Update tooltip
      tooltip
        .style("opacity", 1)
        .html(tooltipHTML)
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 30}px`);
    }

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

    // Add mouse events
    overlay.on("mousemove", handleMouseMove).on("mouseout", hideTooltip);

    // Initialize window variables for SummaryStats
    window.visibleTimeSeriesData = {
      ...data,
      dates: data.dates,
      values: data.values,
    };

    window.visibleTimeSeriesData2 = {
      ...data2,
      dates: data2.dates,
      values: data2.values,
    };

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
      // Clean up global variables on unmount
      delete window.visibleTimeSeriesData;
      delete window.visibleTimeSeriesData2;
    };
  }, [data, data2, onVisibleDataChange, onVisibleData2Change, yAxisTitle]);

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

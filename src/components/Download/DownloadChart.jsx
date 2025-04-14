import React from "react";

/**
 * A reusable component for downloading chart SVGs as images
 * @param {Object} props - Component props
 * @param {string} props.chartType - Type of chart being displayed (for filename)
 * @param {React.RefObject} props.chartContainerRef - Reference to the chart container element
 * @param {string} props.className - Optional additional CSS class name
 */
const DownloadChartButton = ({
  chartType = "chart",
  chartContainerRef,
  className = "",
}) => {
  // Function to download the chart as an image
  const downloadChartAsImage = () => {
    if (!chartContainerRef || !chartContainerRef.current) {
      console.error("Chart container reference is missing");
      return;
    }

    // Find the SVG element within our chart container
    const svgElement = chartContainerRef.current.querySelector("svg");

    if (!svgElement) {
      console.error("SVG element not found");
      return;
    }

    try {
      // Create a copy of the SVG to modify for download
      const svgClone = svgElement.cloneNode(true);

      // Set the background color to white
      svgClone.style.backgroundColor = "white";

      // Make sure all styles are included
      const inlineStyles = document.createElement("style");
      inlineStyles.textContent = Array.from(document.styleSheets)
        .filter((styleSheet) => {
          try {
            return (
              !styleSheet.href ||
              styleSheet.href.startsWith(window.location.origin)
            );
          } catch (err) {
            return false;
          }
        })
        .map((styleSheet) => {
          try {
            return Array.from(styleSheet.cssRules)
              .map((rule) => rule.cssText)
              .join("\n");
          } catch (err) {
            console.warn("Failed to access cssRules for stylesheet: ", err);
            return "";
          }
        })
        .join("\n");

      svgClone.prepend(inlineStyles);

      // Set dimensions explicitly
      svgClone.setAttribute("width", svgElement.clientWidth);
      svgClone.setAttribute("height", svgElement.clientHeight);

      // Serialize the SVG to a string
      const svgData = new XMLSerializer().serializeToString(svgClone);

      // Create a Blob from the SVG string
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });

      // Create an Image object
      const img = new Image();

      // When the image loads, draw it on a canvas and download
      img.onload = () => {
        // Create a canvas element
        const canvas = document.createElement("canvas");
        canvas.width = svgElement.clientWidth;
        canvas.height = svgElement.clientHeight;

        // Draw the image on the canvas
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Convert the canvas to a data URL
        const dataUrl = canvas.toDataURL("image/png");

        // Create a link element and trigger download
        const link = document.createElement("a");
        link.href = dataUrl;

        // Generate a suitable filename based on chart type
        const filename = chartType.replace(/\s+/g, "_").toLowerCase();
        link.download = `${filename}_${
          new Date().toISOString().split("T")[0]
        }.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      // Load the image from the SVG Blob URL
      img.src = URL.createObjectURL(svgBlob);
    } catch (error) {
      console.error("Error downloading chart:", error);
    }
  };

  return (
    <button
      onClick={downloadChartAsImage}
      className={className}
      title="Download Chart"
    >
      Download Chart
    </button>
  );
};

export default DownloadChartButton;

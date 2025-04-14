import React, { useRef } from "react";

/**
 * A select component for downloading chart data in different formats
 * @param {Object} props - Component props
 * @param {string} props.chartTitle - Title of the chart (for filename)
 * @param {string} props.className - Additional CSS class for styling
 */
const DownloadDataSelect = ({ chartTitle = "chart-data", className = "" }) => {
  const selectRef = useRef(null);

  // Function to download data in specified format
  const handleFormatSelect = (e) => {
    const format = e.target.value;

    // Reset select to default option after selection
    if (selectRef.current) {
      selectRef.current.selectedIndex = 0;
    }

    // If default option is selected, do nothing
    if (format === "default") return;

    // Get data from the global variable that TimeSeriesChart sets
    const data = window.visibleTimeSeriesData;

    if (!data || !data.dates || !data.values || data.dates.length === 0) {
      console.error("No data available to download");
      alert("No visible data to download");
      return;
    }

    let content = "";
    let mimeType = "";
    let fileExtension = "";

    // Generate appropriate file content based on format
    if (format === "csv") {
      mimeType = "text/csv";
      fileExtension = "csv";

      // Create structured data for CSV (array of objects)
      const structuredData = data.dates.map((date, index) => ({
        date: date,
        value: data.values[index],
        ...(data.location
          ? {
              location: data.location.name,
              latitude: data.location.latitude,
              longitude: data.location.longitude,
            }
          : {}),
      }));

      // Create CSV header
      const headers = Object.keys(structuredData[0]);
      content = headers.join(",") + "\n";

      // Add data rows
      structuredData.forEach((item) => {
        const row = headers
          .map((header) => {
            const value = item[header];
            // Handle special characters for CSV
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",");
        content += row + "\n";
      });
    } else if (format === "json") {
      // JSON format - maintain the array structure
      mimeType = "application/json";
      fileExtension = "json";

      // Create a JSON object that preserves the array structure
      const jsonData = {
        title: data.title || chartTitle,
        units: data.units || "",
        dates: data.dates,
        values: data.values,
      };

      // Add location if available
      if (data.location) {
        jsonData.location = data.location;
      }

      content = JSON.stringify(jsonData, null, 2); // Pretty print with 2 spaces
    }

    // Create a blob and download link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // Create and trigger download link
    const link = document.createElement("a");
    link.href = url;
    link.download = `${chartTitle.replace(/\s+/g, "-").toLowerCase()}_${
      new Date().toISOString().split("T")[0]
    }.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  };

  return (
    <select
      onChange={handleFormatSelect}
      ref={selectRef}
      className={`download-data-select ${className}`}
    >
      <option value="default">Download Data</option>
      <option value="csv">CSV Format</option>
      <option value="json">JSON Format</option>
    </select>
  );
};

export default DownloadDataSelect;

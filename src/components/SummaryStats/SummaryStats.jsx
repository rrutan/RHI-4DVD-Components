import React, { useState, useEffect } from "react";
import {
  mean,
  median,
  min,
  max,
  variance,
  standardDeviation,
  sampleKurtosis,
  sampleSkewness,
  quantile,
} from "simple-statistics";
import "./SummaryStats.css";

const SummaryStats = ({ data, data2 }) => {
  const [statsData, setStatsData] = useState(data);
  const [statsData2, setStatsData2] = useState(data2);

  // Effect to check for window.visibleTimeSeriesData (set by TimeSeriesChart or MultiTS)
  useEffect(() => {
    // Function to check for updated visible data
    const checkForVisibleData = () => {
      if (
        window.visibleTimeSeriesData &&
        window.visibleTimeSeriesData.dates &&
        window.visibleTimeSeriesData.dates.length > 0
      ) {
        setStatsData(window.visibleTimeSeriesData);
      } else {
        setStatsData(data);
      }

      // Check for second dataset
      if (
        window.visibleTimeSeriesData2 &&
        window.visibleTimeSeriesData2.dates &&
        window.visibleTimeSeriesData2.dates.length > 0
      ) {
        setStatsData2(window.visibleTimeSeriesData2);
      } else {
        setStatsData2(data2);
      }
    };

    // Check immediately
    checkForVisibleData();

    // Set up interval to check periodically
    const intervalId = setInterval(checkForVisibleData, 300);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [data, data2]);

  // Helper function to calculate statistics for a dataset
  const calculateStats = (dataset) => {
    if (!dataset || !dataset.values || dataset.values.length === 0) {
      return null;
    }

    const values = dataset.values;
    return {
      values,
      avg: mean(values).toFixed(2),
      med: median(values).toFixed(2),
      minimum: min(values),
      maximum: max(values),
      stdDev: standardDeviation(values).toFixed(2),
      vari: variance(values).toFixed(2),
      skewness: sampleSkewness(values).toFixed(2),
      kurtosis: sampleKurtosis(values).toFixed(2),
      q25: quantile(values, 0.25).toFixed(2),
      q75: quantile(values, 0.75).toFixed(2),
      startdate: dataset.dates[0],
      enddate: dataset.dates[dataset.dates.length - 1],
    };
  };

  // Calculate stats for datasets
  const stats1 = calculateStats(statsData);
  const stats2 = data2 ? calculateStats(statsData2) : null;

  // Location information
  const location1 = {
    name: "Yuma, CA",
    coords: "32.7920° N, 115.5631° W",
  };

  const location2 = {
    name: "Bombay Beach, CA",
    coords: "33.3539° N, 115.7319° W",
  };

  // Default data variable name
  const dataVar = "Temperature °F";

  // Handle no data case
  if (!stats1 && !stats2) {
    return <div className="summary-menu">No data available</div>;
  }

  // Function to format dates for display
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return "";
    return `${startDate} to ${endDate}`;
  };

  // Single dataset display with the same layout style as multi-dataset
  if (stats1 && !stats2) {
    return (
      <div className="summary-menu">
        <h3>Summary Statistics</h3>

        <div className="location-info">
          <h4>{location1.name}</h4>
          <h5>{location1.coords}</h5>
          <h5>{dataVar}</h5>
        </div>

        <div className="date-range">
          <h5>{formatDateRange(stats1.startdate, stats1.enddate)}</h5>
        </div>

        {/* Header row with location name */}
        <div className="stats-comparison-header">
          <div className="stats-label">Statistic</div>
          <div className="stats-value">Value</div>
        </div>

        {/* Stats rows */}
        <div className="stats-comparison-row">
          <div className="stats-label">Min</div>
          <div className="stats-value">{stats1.minimum}</div>
        </div>

        <div className="stats-comparison-row">
          <div className="stats-label">Q1 (25%)</div>
          <div className="stats-value">{stats1.q25}</div>
        </div>

        <div className="stats-comparison-row">
          <div className="stats-label">Median (50%)</div>
          <div className="stats-value">{stats1.med}</div>
        </div>

        <div className="stats-comparison-row">
          <div className="stats-label">Mean</div>
          <div className="stats-value">{stats1.avg}</div>
        </div>

        <div className="stats-comparison-row">
          <div className="stats-label">Q3 (75%)</div>
          <div className="stats-value">{stats1.q75}</div>
        </div>

        <div className="stats-comparison-row">
          <div className="stats-label">Max</div>
          <div className="stats-value">{stats1.maximum}</div>
        </div>

        <div className="stats-comparison-row">
          <div className="stats-label">Std Dev</div>
          <div className="stats-value">{stats1.stdDev}</div>
        </div>

        <div className="stats-comparison-row">
          <div className="stats-label">Variance</div>
          <div className="stats-value">{stats1.vari}</div>
        </div>

        <div className="stats-comparison-row">
          <div className="stats-label">Skewness</div>
          <div className="stats-value">{stats1.skewness}</div>
        </div>

        <div className="stats-comparison-row">
          <div className="stats-label">Kurtosis</div>
          <div className="stats-value">{stats1.kurtosis}</div>
        </div>
      </div>
    );
  }

  // Multiple datasets display (side by side)
  return (
    <div className="summary-menu">
      <h3>Summary Statistics</h3>

      <div className="location-info">
        <h5>{dataVar}</h5>
      </div>

      <div className="date-range">
        {stats1 && stats2 && (
          <h5>{formatDateRange(stats1.startdate, stats1.enddate)}</h5>
        )}
      </div>

      {/* Header row with location names */}
      <div className="stats-comparison-header">
        <div className="stats-label">Statistic</div>
        <div className="stats-value">{location1.name}</div>
        <div className="stats-value">{location2.name}</div>
      </div>

      {/* Location coordinates row */}
      <div className="stats-comparison-row location-row">
        <div className="stats-label">Coordinates</div>
        <div className="stats-value">{location1.coords}</div>
        <div className="stats-value">{location2.coords}</div>
      </div>

      {/* Stats rows */}
      <div className="stats-comparison-row">
        <div className="stats-label">Min</div>
        {stats1 && <div className="stats-value">{stats1.minimum}</div>}
        {stats2 && <div className="stats-value">{stats2.minimum}</div>}
      </div>

      <div className="stats-comparison-row">
        <div className="stats-label">Q1 (25%)</div>
        {stats1 && <div className="stats-value">{stats1.q25}</div>}
        {stats2 && <div className="stats-value">{stats2.q25}</div>}
      </div>

      <div className="stats-comparison-row">
        <div className="stats-label">Median (50%)</div>
        {stats1 && <div className="stats-value">{stats1.med}</div>}
        {stats2 && <div className="stats-value">{stats2.med}</div>}
      </div>

      <div className="stats-comparison-row">
        <div className="stats-label">Mean</div>
        {stats1 && <div className="stats-value">{stats1.avg}</div>}
        {stats2 && <div className="stats-value">{stats2.avg}</div>}
      </div>

      <div className="stats-comparison-row">
        <div className="stats-label">Q3 (75%)</div>
        {stats1 && <div className="stats-value">{stats1.q75}</div>}
        {stats2 && <div className="stats-value">{stats2.q75}</div>}
      </div>

      <div className="stats-comparison-row">
        <div className="stats-label">Max</div>
        {stats1 && <div className="stats-value">{stats1.maximum}</div>}
        {stats2 && <div className="stats-value">{stats2.maximum}</div>}
      </div>

      <div className="stats-comparison-row">
        <div className="stats-label">Std Dev</div>
        {stats1 && <div className="stats-value">{stats1.stdDev}</div>}
        {stats2 && <div className="stats-value">{stats2.stdDev}</div>}
      </div>

      <div className="stats-comparison-row">
        <div className="stats-label">Variance</div>
        {stats1 && <div className="stats-value">{stats1.vari}</div>}
        {stats2 && <div className="stats-value">{stats2.vari}</div>}
      </div>

      <div className="stats-comparison-row">
        <div className="stats-label">Skewness</div>
        {stats1 && <div className="stats-value">{stats1.skewness}</div>}
        {stats2 && <div className="stats-value">{stats2.skewness}</div>}
      </div>

      <div className="stats-comparison-row">
        <div className="stats-label">Kurtosis</div>
        {stats1 && <div className="stats-value">{stats1.kurtosis}</div>}
        {stats2 && <div className="stats-value">{stats2.kurtosis}</div>}
      </div>
    </div>
  );
};

export default SummaryStats;

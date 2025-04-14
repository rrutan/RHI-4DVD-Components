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

const SummaryStats = ({ data }) => {
  const [statsData, setStatsData] = useState(data);

  // Effect to check for window.visibleTimeSeriesData (set by TimeSeriesChart)
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
    };

    // Check immediately
    checkForVisibleData();

    // Set up interval to check periodically
    const intervalId = setInterval(checkForVisibleData, 300);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [data]);

  if (!statsData || !statsData.values || statsData.values.length === 0) {
    return <div className="summary-menu"> No data available </div>;
  }

  const values = statsData.values;
  const avg = mean(values).toFixed(2);
  const med = median(values).toFixed(2);
  const minimum = min(values);
  const maximum = max(values);
  const stdDev = standardDeviation(values).toFixed(2);
  const vari = variance(values).toFixed(2);
  const skewness = sampleSkewness(values).toFixed(2);
  const kurtosis = sampleKurtosis(values).toFixed(2);
  const q25 = quantile(values, 0.25).toFixed(2);
  const q75 = quantile(values, 0.75).toFixed(2);
  const startdate = statsData.dates[0];
  const enddate = statsData.dates[statsData.dates.length - 1];
  const dataVar = "Temperature °F";
  const location = "El Centro, CA";
  const coords = "32.7920° N, 115.5631° W";
  return (
    <div className="summary-menu">
      <h3>Summary Statistics</h3>
      <h4>
        {location}
        <br />
        {coords}
      </h4>
      <h4>{dataVar}</h4>
      <h4>
        {startdate} to {enddate}
      </h4>

      <div className="summary-item">
        <strong>Min:</strong> <span>{minimum}</span>
      </div>
      <div className="summary-item">
        <strong>Q1(25%):</strong> <span>{q25}</span>
      </div>
      <div className="summary-item">
        <strong>Median(50%):</strong> <span>{med}</span>
      </div>
      <div className="summary-item">
        <strong>Mean:</strong> <span>{avg}</span>
      </div>
      <div className="summary-item">
        <strong>Q3(75%):</strong> <span>{q75}</span>
      </div>
      <div className="summary-item">
        <strong>Max:</strong> <span>{maximum}</span>
      </div>
      <div className="summary-item">
        <strong>Std Dev:</strong> <span>{stdDev}</span>
      </div>
      <div className="summary-item">
        <strong>Variance:</strong> <span>{vari}</span>
      </div>
      <div className="summary-item">
        <strong>Skewness:</strong> <span>{skewness}</span>
      </div>
      <div className="summary-item">
        <strong>Kurtosis:</strong> <span>{kurtosis}</span>
      </div>
    </div>
  );
};

export default SummaryStats;

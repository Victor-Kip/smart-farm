import React, { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData({
        temperature: (20 + Math.random() * 10).toFixed(1),
        humidity: (50 + Math.random() * 30).toFixed(1),
        soilMoisture: (30 + Math.random() * 40).toFixed(1),
        lightIntensity: (20 + Math.random() * 20).toFixed(1),
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      <h1>🌿 Smart Farm Dashboard</h1>
      <div className="card-container">
        <SensorCard title="Temperature" value={`${data.temperature} °C`} />
        <SensorCard title="Humidity" value={`${data.humidity} %`} />
        <SensorCard title="Soil Moisture" value={`${data.soilMoisture} %`} />
        <SensorCard title = "Light Intensity" value={`${data.lightIntensity}`}/>
      </div>
    </div>
  );
}

function SensorCard({ title, value }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>{value}</p>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { connectToFirebase, fetchHistoricalData } from "./firebaseService";
import "./App.css";

export default function App() {
  const [data, setData] = useState({
    temperature: 'Loading...',
    humidity: 'Loading...',
    soilMoisture: 'Loading...',
    lightIntensity: 'Loading...',
  });
 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [dataRange, setDataRange] = useState('24h');

  useEffect(() => {
    // Connect to Firebase and get real-time data
    const unsubscribe = connectToFirebase(setData, setLoading, setError, setLastUpdated);
    
    // Fetch historical data
    loadHistoricalData();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dataRange]);

  const loadHistoricalData = async () => {
    try {
      const historical = await fetchHistoricalData(dataRange);
      setHistoricalData(historical);
    } catch (err) {
      console.error('Error loading historical data:', err);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="dashboard">
        <h1>🌿 Smart Farm Dashboard</h1>
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const chartData = historicalData.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    temperature: parseFloat(item.temperature) || 0,
    humidity: parseFloat(item.humidity) || 0,
    soilMoisture: parseFloat(item.soilMoisture) || 0,
    lightIntensity: parseFloat(item.lightIntensity) || 0,
  }));

  // Prepare data for pie chart (current values distribution)
  const pieData = [
    { name: 'Temperature', value: parseFloat(data.temperature) || 0, color: '#FF6B6B' },
    { name: 'Humidity', value: parseFloat(data.humidity) || 0, color: '#4ECDC4' },
    { name: 'Soil Moisture', value: parseFloat(data.soilMoisture) || 0, color: '#45B7D1' },
    { name: 'Light Intensity', value: (parseFloat(data.lightIntensity) || 0) / 100, color: '#FFA726' }
  ];

  return (
    <div className="dashboard">
      <h1>🌿 Smart Farm Dashboard</h1>
      
      {/* Navigation Tabs */}
      <div className="tab-container">
        <button 
          className={`tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          Data
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {loading && (
        <div className="loading-message">
          <p>Connecting to Firebase...</p>
        </div>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="tab-content">
          <div className="card-container">
            <SensorCard
              title="Temperature"
              value={data.temperature !== 'N/A' && data.temperature !== 'No Data' ? `${data.temperature} °C` : data.temperature}
              loading={loading}
              icon="🌡️"
            />
            <SensorCard
              title="Humidity"
              value={data.humidity !== 'N/A' && data.humidity !== 'No Data' ? `${data.humidity} %` : data.humidity}
              loading={loading}
              icon="💧"
            />
            <SensorCard
              title="Soil Moisture"
              value={data.soilMoisture !== 'N/A' && data.soilMoisture !== 'No Data' ? `${data.soilMoisture} m³/m³` : data.soilMoisture}
              loading={loading}
              icon="🌱"
            />
            <SensorCard
              title="Light Intensity"
              value={data.lightIntensity !== 'N/A' && data.lightIntensity !== 'No Data' ? `${data.lightIntensity} lux` : data.lightIntensity}
              loading={loading}
              icon="☀️"
            />
          </div>
          
          {lastUpdated && (
            <div className="last-updated">
              <p>Last updated: {lastUpdated.toLocaleString()}</p>
            </div>
          )}
       
          <div className="controls">
            <label>Data Range: </label>
            <select value={dataRange} onChange={(e) => setDataRange(e.target.value)}>
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div className="chart-container">
            <div className="chart-section">
              <h3>Temperature & Humidity Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" stroke="#FF6B6B" strokeWidth={2} name="Temperature (°C)" />
                  <Line type="monotone" dataKey="humidity" stroke="#4ECDC4" strokeWidth={2} name="Humidity (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-section">
              <h3>Soil Moisture & Light Intensity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="soilMoisture" stroke="#45B7D1" strokeWidth={2} name="Soil Moisture (%)" />
                  <Line type="monotone" dataKey="lightIntensity" stroke="#FFA726" strokeWidth={2} name="Light Intensity (lux)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="data-table-container">
            <h3>Recent Readings</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Temperature (°C)</th>
                    <th>Humidity (%)</th>
                    <th>Soil Moisture (m³/m³)</th>
                    <th>Light Intensity (lux)</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalData.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td>{new Date(item.timestamp).toLocaleString()}</td>
                      <td>{item.temperature}</td>
                      <td>{item.humidity}</td>
                      <td>{item.soilMoisture}</td>
                      <td>{item.lightIntensity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="tab-content">
          <div className="analytics-grid">
            <div className="chart-section">
              <h3>Current Values Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-section">
              <h3>Average Values Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Temperature', value: chartData.reduce((sum, item) => sum + item.temperature, 0) / chartData.length || 0 },
                  { name: 'Humidity', value: chartData.reduce((sum, item) => sum + item.humidity, 0) / chartData.length || 0 },
                  { name: 'Soil Moisture', value: chartData.reduce((sum, item) => sum + item.soilMoisture, 0) / chartData.length || 0 },
                  { name: 'Light Intensity', value: (chartData.reduce((sum, item) => sum + item.lightIntensity, 0) / chartData.length || 0) / 100 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="stats-grid">
              <StatCard 
                title="Optimal Temperature Range" 
                value="18-24°C" 
                current={data.temperature}
                status={parseFloat(data.temperature) >= 18 && parseFloat(data.temperature) <= 24 ? "Good" : "Warning"}
              />
              <StatCard 
                title="Optimal Humidity Range" 
                value="40-60%" 
                current={data.humidity}
                status={parseFloat(data.humidity) >= 40 && parseFloat(data.humidity) <= 60 ? "Good" : "Warning"}
              />
              <StatCard 
                title="Optimal Soil Moisture" 
                value="3.0-10.0 m³/m³"
                current={data.soilMoisture}
                status={parseFloat(data.soilMoisture) >= 3.0 && parseFloat(data.soilMoisture) <= 10.0 ? "Good" : "Warning"}
              />
              <StatCard 
                title="Optimal Light Intensity" 
                value="200-800 lux" 
                current={data.lightIntensity}
                status={parseFloat(data.lightIntensity) >= 200 && parseFloat(data.lightIntensity) <= 800 ? "Good" : "Warning"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SensorCard({ title, value, loading, icon }) {
  return (
    <div className={`card ${loading ? 'loading' : ''}`}>
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <h2>{title}</h2>
      </div>
      <p className="sensor-value">{value}</p>
      {loading && <div className="loading-spinner"></div>}
    </div>
  );
}

function StatCard({ title, value, current, status }) {
  return (
    <div className={`stat-card ${status.toLowerCase()}`}>
      <h4>{title}</h4>
      <p className="optimal-range">{value}</p>
      <p className="current-value">Current: {current}</p>
      <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>
    </div>
  );
}
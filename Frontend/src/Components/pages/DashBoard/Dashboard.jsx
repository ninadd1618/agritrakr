import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import Navbar from "../../Navbar/Navbar";
import styled from "styled-components";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const Header = styled(Box)`
  background-color: hsl(0deg 0% 95.29%);
  position: fixed;
  width: ${(props) => (props.isOpen ? "88%" : "100%")};
  z-index: 1;
  padding: 0% 2% 0% 1%;
  height: 70px;
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const GridContainer = styled.div`
  padding-top: 1px;
  display: inline-block;
  min-height: 100vh;
  justify-content: center;
  width: ${(props) => (props?.isOpen ? "98%" : "98%")};
  position: relative;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

function formatDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const downloadCSV = (rows, filename = 'soil-data.csv') => {
  if (!rows || rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => r[k]).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Individual metric chart component with status indicator
const MetricChart = ({ data, metricKey, metricLabel, idealValue, unit = '%' }) => {
  const chartData = data.map(item => ({
    label: formatDate(item.timestamp),
    actual: item[metricKey],
    ideal: idealValue
  }));

  // Calculate current status
  const latestValue = data.length > 0 ? data[data.length - 1][metricKey] : 0;
  const deviation = latestValue - idealValue;
  const deviationPercent = idealValue > 0 ? ((deviation / idealValue) * 100).toFixed(1) : 0;
  const status = Math.abs(deviation) < (idealValue * 0.1) ? 'good' : Math.abs(deviation) < (idealValue * 0.2) ? 'warning' : 'critical';
  const statusColor = status === 'good' ? '#4caf50' : status === 'warning' ? '#ff9800' : '#f44336';

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minHeight: 280
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{metricLabel}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: statusColor
          }}></div>
          <span style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>
            {latestValue?.toFixed(1)}{unit}
          </span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 10 }}>
        {deviationPercent > 0 ? '+' : ''}{deviationPercent}% from ideal ({idealValue}{unit})
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData}>
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#1976d2"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="ideal"
            name="Ideal"
            stroke="#4caf50"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const Dashboard = ({ isOpen, toggle }) => {
  const [data, setData] = useState([]);
  const [ideals, setIdeals] = useState({});
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    overallHealth: 0,
    avgNutrient: 0,
    lastUpdate: null,
    moisture: 0,
    pH: 0,
    temp: 0,
    criticalCount: 0,
    warningCount: 0,
    goodCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/v1/soil/data', {
          // Removed deviceId filter to show all sensors
          withCredentials: true,
        });
        const d = res.data?.data || [];

        const chartData = d.map(item => ({
          timestamp: item.timestamp,
          moisture: item.moisture,
          pH: item.pH,
          temp: item.temp,
          phosphorus: item.phosphorus,
          sulfur: item.sulfur,
          zinc: item.zinc,
          iron: item.iron,
          manganese: item.manganese,
          copper: item.copper,
          potassium: item.potassium,
          calcium: item.calcium,
          magnesium: item.magnesium,
          sodium: item.sodium
        }));
        setData(chartData);

        const idealsRes = await axios.get('/api/v1/soil/ideals', {
          withCredentials: true,
        });
        const rawIdeals = idealsRes.data?.data || {};

        const normalizeIdeal = (field, fallback) => {
          const v = rawIdeals[field];
          if (typeof v === 'number') return v;
          if (v && typeof v === 'object' && v.min != null && v.max != null) {
            return (Number(v.min) + Number(v.max)) / 2;
          }
          return fallback;
        };

        const idealsData = {
          moisture: normalizeIdeal('moisture', 50),
          pH: normalizeIdeal('pH', 6.5),
          temp: normalizeIdeal('temperature', 20),
          phosphorus: normalizeIdeal('phosphorus', 60),
          sulfur: normalizeIdeal('sulfur', 60),
          zinc: normalizeIdeal('zinc', 60),
          iron: normalizeIdeal('iron', 60),
          manganese: normalizeIdeal('manganese', 60),
          copper: normalizeIdeal('copper', 60),
          potassium: normalizeIdeal('potassium', 60),
          calcium: normalizeIdeal('calcium', 60),
          magnesium: normalizeIdeal('magnesium', 60),
          sodium: normalizeIdeal('sodium', 60),
        };

        setIdeals(idealsData);

        // Calculate comprehensive summary stats
        if (chartData.length > 0) {
          const latest = chartData[chartData.length - 1];
          const metrics = ['phosphorus', 'sulfur', 'zinc', 'iron', 'manganese', 'copper', 'potassium', 'calcium', 'magnesium', 'sodium'];
          const avgNutrient = metrics.reduce((sum, key) => sum + (latest[key] || 0), 0) / metrics.length;

          // Count metrics by status
          let critical = 0, warning = 0, good = 0;
          metrics.forEach(key => {
            const value = latest[key] || 0;
            const ideal = idealsData[key] || 0;
            const deviation = Math.abs(value - ideal);
            if (deviation >= ideal * 0.2) critical++;
            else if (deviation >= ideal * 0.1) warning++;
            else good++;
          });

          setSummaryData({
            overallHealth: Math.round((latest.moisture / idealsData.moisture) * 100),
            avgNutrient: Math.round(avgNutrient),
            lastUpdate: latest.timestamp,
            moisture: latest.moisture || 0,
            pH: latest.pH || 0,
            temp: latest.temp || 0,
            criticalCount: critical,
            warningCount: warning,
            goodCount: good
          });
        }
      } catch (err) {
        console.error('Soil dashboard fetch error', err?.response || err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const environmentalMetrics = [
    { key: 'moisture', label: 'Soil Moisture', unit: '%' },
    { key: 'pH', label: 'Soil pH', unit: '' },
    { key: 'temp', label: 'Soil Temperature', unit: '°C' }
  ];

  const nutrients = [
    { key: 'phosphorus', label: 'Phosphorus (P)', unit: '%' },
    { key: 'sulfur', label: 'Sulfur (S)', unit: '%' },
    { key: 'zinc', label: 'Zinc (Zn)', unit: '%' },
    { key: 'iron', label: 'Iron (Fe)', unit: '%' },
    { key: 'manganese', label: 'Manganese (Mn)', unit: '%' },
    { key: 'copper', label: 'Copper (Cu)', unit: '%' },
    { key: 'potassium', label: 'Potassium (K)', unit: '%' },
    { key: 'calcium', label: 'Calcium (Ca)', unit: '%' },
    { key: 'magnesium', label: 'Magnesium (Mg)', unit: '%' },
    { key: 'sodium', label: 'Sodium (Na)', unit: '%' }
  ];

  if (loading) {
    return (
      <GridContainer isOpen={isOpen}>
        <Header isOpen={isOpen}>
          <Navbar />
        </Header>
        <div style={{ padding: 40, textAlign: 'center', marginTop: 80 }}>Loading soil data...</div>
      </GridContainer>
    );
  }

  return (
    <GridContainer isOpen={isOpen}>
      <Header isOpen={isOpen}>
        <Navbar />
      </Header>

      <div style={{
        padding: 24,
        background: 'white',
        minHeight: '100vh',
        marginTop: 70,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Summary Overview */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Summary Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Soil Health Score</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1976d2' }}>
                {summaryData.overallHealth}%
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Based on moisture levels</div>
            </div>
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Avg Nutrient Level</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#4caf50' }}>
                {summaryData.avgNutrient}%
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>All nutrients combined</div>
            </div>
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Soil Moisture</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#2196f3' }}>
                {summaryData.moisture?.toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Current soil moisture</div>
            </div>
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Soil pH Level</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#9c27b0' }}>
                {summaryData.pH?.toFixed(1)}
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Acidity/alkalinity</div>
            </div>
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Soil Temperature</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#ff5722' }}>
                {summaryData.temp?.toFixed(1)}°C
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Current soil temp</div>
            </div>
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Status Overview</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#4caf50' }}>{summaryData.goodCount}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>Good</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ff9800' }}>{summaryData.warningCount}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>Warning</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f44336' }}>{summaryData.criticalCount}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>Critical</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Conditions */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Environmental Conditions</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20
          }}>
            {environmentalMetrics.map(metric => (
              <MetricChart
                key={metric.key}
                data={data}
                metricKey={metric.key}
                metricLabel={metric.label}
                idealValue={ideals[metric.key]}
                unit={metric.unit}
              />
            ))}
          </div>
        </div>

        {/* Nutrient Performance Grid */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Nutrient Performance Analysis</h2>
            <button
              onClick={() => downloadCSV(data.map(d => ({
                timestamp: new Date(d.timestamp).toISOString(),
                moisture: d.moisture,
                pH: d.pH,
                temp: d.temp,
                phosphorus: d.phosphorus,
                sulfur: d.sulfur,
                zinc: d.zinc,
                iron: d.iron,
                manganese: d.manganese,
                copper: d.copper,
                potassium: d.potassium,
                calcium: d.calcium,
                magnesium: d.magnesium,
                sodium: d.sodium
              })), 'soil-readings.csv')}
              style={{
                padding: '8px 16px',
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              Download CSV Report
            </button>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20
          }}>
            {nutrients.map(metric => (
              <MetricChart
                key={metric.key}
                data={data}
                metricKey={metric.key}
                metricLabel={metric.label}
                idealValue={ideals[metric.key]}
                unit={metric.unit}
              />
            ))}
          </div>
        </div>
      </div>
    </GridContainer>
  );
};

export default Dashboard;
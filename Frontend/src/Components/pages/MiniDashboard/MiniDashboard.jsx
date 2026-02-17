import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import Navbar from "../../Navbar/Navbar";
import styled from "styled-components";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, ResponsiveContainer } from 'recharts';
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

function MiniDashboard({ isOpen, toggle, isVisi = true }) {
  const [soilData, setSoilData] = useState([]);
  const [ideals, setIdeals] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch soil data and ideals
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dataRes, idealsRes] = await Promise.all([
          axios.get('/api/v1/soil/data', {
            withCredentials: true,
          }),
          axios.get('/api/v1/soil/ideals', {
            withCredentials: true,
          })
        ]);
        setSoilData(dataRes.data.data || dataRes.data?.data || []);

        const rawIdeals = idealsRes.data.data || idealsRes.data?.data || idealsRes.data?.ideals || {};
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
          temperature: normalizeIdeal('temperature', 20),
          phosphorus: normalizeIdeal('phosphorus', 70),
          potassium: normalizeIdeal('potassium', 210),
          nitrogen: normalizeIdeal('nitrogen', 150),
        };

        setIdeals(idealsData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching soil data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate averages from recent readings
  const getAverage = (field) => {
    if (!soilData.length) return 0;
    const values = soilData.map(d => d[field] || 0);
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const avgMoisture = getAverage('moisture');
  const avgPh = getAverage('pH');
  const avgTemp = getAverage('temperature');
  const avgPhosphorus = getAverage('phosphorus');
  const avgPotassium = getAverage('potassium');
  const avgNitrogen = getAverage('nitrogen');

  // Calculate percentage for radial charts
  const getPercentage = (value, ideal) => {
    if (!ideal || !value) return 0;
    return Math.min(100, (value / ideal) * 100);
  };

  const getStatusColor = (value, ideal) => {
    if (!ideal || !value) return '#4caf50';
    const deviation = Math.abs(((value - ideal) / ideal) * 100);
    if (deviation <= 10) return '#4caf50';
    if (deviation <= 20) return '#ff9800';
    return '#f44336';
  }

  // Safe access to ideals with defaults
  const safeIdeals = {
    moisture: ideals?.moisture || 50,
    pH: ideals?.pH || 6.5,
    temperature: ideals?.temperature || 20,
    phosphorus: ideals?.phosphorus || 70,
    potassium: ideals?.potassium || 210,
    nitrogen: ideals?.nitrogen || 150
  };



  if (loading) {
    return (
      <GridContainer isOpen={isOpen}>
        <Header isOpen={isOpen}>
          <Navbar title="Mini-Dashboard" />
        </Header>
        <div style={{ padding: 40, textAlign: 'center', marginTop: 80 }}>Loading soil data...</div>
      </GridContainer>
    );
  }

  // Prepare data for bar chart
  const nutrientData = [
    { name: 'N', value: parseFloat(avgNitrogen), color: '#4caf50' },
    { name: 'P', value: parseFloat(avgPhosphorus), color: '#2196f3' },
    { name: 'K', value: parseFloat(avgPotassium), color: '#ff9800' },
  ];

  const avgCalcium = getAverage('calcium');
  const avgMagnesium = getAverage('magnesium');

  return (
    <GridContainer isOpen={isOpen}>
      <Header isOpen={isOpen}>
        <Navbar title="Mini-Dashboard" />
      </Header>

      <div style={{
        padding: 24,
        background: 'white',
        minHeight: '100vh',
        marginTop: 70,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Compact Summary Cards - 3 Key Metrics */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Soil Moisture</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#2196f3' }}>
                {avgMoisture}%
              </div>
              <div style={{
                fontSize: 11,
                color: getStatusColor(avgMoisture, safeIdeals.moisture),
                marginTop: 4
              }}>
                Target: {safeIdeals.moisture}%
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>pH Level</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#9c27b0' }}>
                {avgPh}
              </div>
              <div style={{
                fontSize: 11,
                color: getStatusColor(avgPh, safeIdeals.pH),
                marginTop: 4
              }}>
                Target: {safeIdeals.pH}
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Temperature</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#ff6b6b' }}>
                {avgTemp}°C
              </div>
              <div style={{
                fontSize: 11,
                color: getStatusColor(avgTemp, safeIdeals.temperature),
                marginTop: 4
              }}>
                Target: {safeIdeals.temperature}°C
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>

          {/* Nutrient Levels - Bar Chart */}
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, marginTop: 0 }}>Nutrient Levels</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={nutrientData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {nutrientData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
              N (Nitrogen), P (Phosphorus), K (Potassium)
            </div>
          </div>

          {/* Status Cards */}
          <div>
            {/* Latest Reading Info */}
            <div style={{
              background: 'white',
              padding: 24,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: 16
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, marginTop: 0 }}>Latest Reading</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#666' }}>Sensor ID</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{soilData[0]?.sensorId || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#666' }}>Time</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {soilData[0] ? new Date(soilData[0].timestamp).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#666' }}>Total Readings</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{soilData.length}</span>
                </div>
              </div>
            </div>

            {/* Individual Nutrient Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{
                background: 'white',
                padding: 16,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Nitrogen (N)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#4caf50' }}>{avgNitrogen}</div>
                <div style={{
                  width: '100%',
                  height: 6,
                  background: '#e0e0e0',
                  borderRadius: 3,
                  marginTop: 8,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, (avgNitrogen / 60) * 100)}%`,
                    height: '100%',
                    background: '#4caf50'
                  }} />
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: 16,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Phosphorus (P)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#2196f3' }}>{avgPhosphorus}</div>
                <div style={{
                  width: '100%',
                  height: 6,
                  background: '#e0e0e0',
                  borderRadius: 3,
                  marginTop: 8,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, (avgPhosphorus / 60) * 100)}%`,
                    height: '100%',
                    background: '#2196f3'
                  }} />
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: 16,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Potassium (K)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9800' }}>{avgPotassium}</div>
                <div style={{
                  width: '100%',
                  height: 6,
                  background: '#e0e0e0',
                  borderRadius: 3,
                  marginTop: 8,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, (avgPotassium / 60) * 100)}%`,
                    height: '100%',
                    background: '#ff9800'
                  }} />
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: 16,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Calcium (Ca)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#9c27b0' }}>{avgCalcium}</div>
                <div style={{
                  width: '100%',
                  height: 6,
                  background: '#e0e0e0',
                  borderRadius: 3,
                  marginTop: 8,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, (avgCalcium / 60) * 100)}%`,
                    height: '100%',
                    background: '#9c27b0'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GridContainer>
  );
}

export default MiniDashboard;
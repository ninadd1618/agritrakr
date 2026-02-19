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

const MetricChart = ({ data, metricKey, metricLabel, idealValue, unit = '%' }) => {
    const chartData = data.map(item => ({
        label: formatDate(item.timestamp),
        actual: item[metricKey],
        ideal: idealValue
    }));

    const getLastMetric = () => {
        for (let i = data.length - 1; i >= 0; i--) {
            const v = data[i][metricKey];
            if (v !== null && v !== undefined) return v;
        }
        return null;
    };

    const rawLatest = getLastMetric();
    const latestValue = rawLatest == null ? null : Number(rawLatest);
    const idealNum = idealValue == null ? null : Number(idealValue);
    const safeLatest = latestValue != null && Number.isFinite(latestValue) ? latestValue : null;
    const safeIdeal = idealNum != null && Number.isFinite(idealNum) ? idealNum : null;
    const deviation = safeLatest != null && safeIdeal != null ? (safeLatest - safeIdeal) : null;
    const deviationPercentRaw = (deviation != null && safeIdeal > 0) ? (deviation / safeIdeal) * 100 : null;
    const deviationPercent = deviationPercentRaw != null && Number.isFinite(deviationPercentRaw) ? Math.round(deviationPercentRaw * 10) / 10 : null;
    const displayPercent = deviationPercent == null ? null : (Math.abs(deviationPercent) > 1000 ? (deviationPercent > 0 ? 1000 : -1000) : deviationPercent);
    const status = (safeLatest == null || safeIdeal == null) ? 'unknown' : (Math.abs(deviation) < (safeIdeal * 0.1) ? 'good' : Math.abs(deviation) < (safeIdeal * 0.2) ? 'warning' : 'critical');
    const statusColor = status === 'good' ? '#4caf50' : status === 'warning' ? '#ff9800' : status === 'critical' ? '#f44336' : '#9e9e9e';

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
                        {safeLatest != null ? safeLatest.toFixed(1) : '-'}{unit}
                    </span>
                </div>
            </div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 10 }}>
                {displayPercent != null ? (displayPercent > 0 ? `+${displayPercent}` : `${displayPercent}`) : '-'}% from ideal ({safeIdeal != null ? safeIdeal : '-'}{unit})
            </div>
            <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
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
                    withCredentials: true,
                });
                const d = res.data?.data || [];

                const toNum = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
                const chartData = d.map(item => ({
                    timestamp: item.timestamp,
                    moisture: toNum(item.moisture),
                    pH: toNum(item.pH),
                    temperature: toNum(item.temperature),
                    nitrogen: toNum(item.nitrogen),
                    phosphorus: toNum(item.phosphorus),
                    sulfur: toNum(item.sulfur),
                    zinc: toNum(item.zinc),
                    iron: toNum(item.iron),
                    manganese: toNum(item.manganese),
                    copper: toNum(item.copper),
                    potassium: toNum(item.potassium),
                    calcium: toNum(item.calcium),
                    magnesium: toNum(item.magnesium)
                }));
                setData(chartData);

                const idealsRes = await axios.get('/api/v1/soil/ideals', { withCredentials: true });
                const rawIdeals = idealsRes.data?.data || {};

                const normalizeIdeal = (field) => {
                    const v = rawIdeals[field];
                    if (typeof v === 'number') return v;
                    if (v && typeof v === 'object' && v.min != null && v.max != null) {
                        return (Number(v.min) + Number(v.max)) / 2;
                    }
                    return null;
                };

                const idealsData = {
                    moisture: normalizeIdeal('moisture'),
                    pH: normalizeIdeal('pH'),
                    temperature: normalizeIdeal('temperature'),
                    nitrogen: normalizeIdeal('nitrogen'),
                    phosphorus: normalizeIdeal('phosphorus'),
                    sulfur: normalizeIdeal('sulfur'),
                    zinc: normalizeIdeal('zinc'),
                    iron: normalizeIdeal('iron'),
                    manganese: normalizeIdeal('manganese'),
                    copper: normalizeIdeal('copper'),
                    potassium: normalizeIdeal('potassium'),
                    calcium: normalizeIdeal('calcium'),
                    magnesium: normalizeIdeal('magnesium')
                };

                setIdeals(idealsData);

                if (chartData.length > 0) {
                    // nutrient keys used for avg nutrient calculation
                    const nutrientKeys = ['nitrogen', 'phosphorus', 'sulfur', 'zinc', 'iron', 'manganese', 'copper', 'potassium', 'calcium', 'magnesium'];
                    // include environmental metrics in the status counts
                    const statusMetrics = nutrientKeys.concat(['moisture', 'pH', 'temperature']);

                    // Get latest value - data is sorted descending by timestamp from API, so index 0 is newest
                    const getLastValue = (key) => {
                        for (let i = 0; i < chartData.length; i++) {
                            const v = chartData[i][key];
                            if (v !== null && v !== undefined) return Number.isFinite(Number(v)) ? Number(v) : null;
                        }
                        return null;
                    };

                    const nutrientPercentages = [];
                    nutrientKeys.forEach(key => {
                        const value = getLastValue(key);
                        const ideal = idealsData[key];
                        if (value == null || ideal == null || ideal === 0) return;
                        const percentage = (value / ideal) * 100;
                        nutrientPercentages.push(Math.min(percentage, 100));
                    });
                    const avgNutrient = nutrientPercentages.length > 0 ? (nutrientPercentages.reduce((sum, pct) => sum + pct, 0) / nutrientPercentages.length) : null;
                    let critical = 0, warning = 0, good = 0;
                    statusMetrics.forEach(key => {
                        const value = getLastValue(key);
                        const ideal = idealsData[key];
                        if (value == null || ideal == null || ideal === 0) return;
                        const deviation = Math.abs(value - ideal);
                        if (deviation >= ideal * 0.2) critical++;
                        else if (deviation >= ideal * 0.1) warning++;
                        else good++;
                    });

                    const keyMetrics = ['moisture', 'pH', 'nitrogen', 'phosphorus', 'potassium'];
                    const keyScoresArr = [];
                    keyMetrics.forEach(key => {
                        const value = getLastValue(key);
                        const ideal = idealsData[key];
                        if (value == null || ideal == null || ideal === 0) return;
                        const deviation = Math.abs(value - ideal);
                        const deviationPercent = (deviation / ideal) * 100;
                        let score;
                        if (deviationPercent <= 5) score = 100;
                        else if (deviationPercent <= 10) score = 90;
                        else if (deviationPercent <= 20) score = 70;
                        else if (deviationPercent <= 30) score = 50;
                        else score = Math.max(20, 100 - deviationPercent);
                        keyScoresArr.push(score);
                    });
                    const overallHealth = keyScoresArr.length > 0 ? Math.round(keyScoresArr.reduce((a, b) => a + b, 0) / keyScoresArr.length) : null;

                    const moistureVal = getLastValue('moisture');
                    const pHVal = getLastValue('pH');
                    const tempVal = getLastValue('temperature');

                    setSummaryData({
                        overallHealth: overallHealth,
                        avgNutrient: avgNutrient != null ? Math.round(avgNutrient) : null,
                        lastUpdate: chartData[chartData.length - 1]?.timestamp || null,
                        moisture: moistureVal,
                        pH: pHVal,
                        temp: tempVal,
                        criticalCount: critical,
                        warningCount: warning,
                        goodCount: good
                    });
                }
            } catch (err) {
                console.error('Error fetching soil data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const environmentalMetrics = [
        { key: 'moisture', label: 'Soil Moisture', unit: '%' },
        { key: 'pH', label: 'Soil pH', unit: '' },
        { key: 'temperature', label: 'Soil Temperature', unit: '°C' }
    ];

    const nutrients = [
        { key: 'nitrogen', label: 'Nitrogen (N)', unit: 'ppm' },
        { key: 'phosphorus', label: 'Phosphorus (P)', unit: 'ppm' },
        { key: 'sulfur', label: 'Sulfur (S)', unit: 'ppm' },
        { key: 'zinc', label: 'Zinc (Zn)', unit: 'ppm' },
        { key: 'iron', label: 'Iron (Fe)', unit: 'ppm' },
        { key: 'manganese', label: 'Manganese (Mn)', unit: 'ppm' },
        { key: 'copper', label: 'Copper (Cu)', unit: 'ppm' },
        { key: 'potassium', label: 'Potassium (K)', unit: 'ppm' },
        { key: 'calcium', label: 'Calcium (Ca)', unit: 'ppm' },
        { key: 'magnesium', label: 'Magnesium (Mg)', unit: 'ppm' }
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
                                {summaryData.overallHealth != null ? `${summaryData.overallHealth}%` : '-'}
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
                                {summaryData.avgNutrient != null ? `${summaryData.avgNutrient}%` : '-'}
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
                                temperature: d.temperature,
                                nitrogen: d.nitrogen,
                                phosphorus: d.phosphorus,
                                sulfur: d.sulfur,
                                zinc: d.zinc,
                                iron: d.iron,
                                manganese: d.manganese,
                                copper: d.copper,
                                potassium: d.potassium,
                                calcium: d.calcium,
                                magnesium: d.magnesium
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

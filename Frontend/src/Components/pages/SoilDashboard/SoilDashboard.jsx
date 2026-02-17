import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

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

// Individual metric chart component
const MetricChart = ({ data, metricKey, metricLabel, idealValue }) => {
    const chartData = data.map(item => ({
        label: formatDate(item.timestamp),
        actual: item[metricKey],
        ideal: idealValue
    }));

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
                <button style={{
                    background: 'none',
                    border: 'none',
                    color: '#1976d2',
                    cursor: 'pointer',
                    fontSize: 13
                }}>View Details</button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                        type="monotone"
                        dataKey="actual"
                        name="Actual Level"
                        stroke="#1976d2"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="ideal"
                        name="Ideal Level"
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

export default function SoilDashboard() {
    const [data, setData] = useState([]);
    const [ideals, setIdeals] = useState({});
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState({
        overallHealth: 0,
        avgNutrient: 0,
        lastUpdate: null
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/v1/soil/data', {
                    withCredentials: true,
                });
                const d = res.data?.data || [];
                const chartData = d.map(item => ({
                    timestamp: item.timestamp,
                    moisture: item.moisture,
                    pH: item.pH,
                    temperature: item.temperature,
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
                    temperature: normalizeIdeal('temperature', 20),
                    phosphorus: normalizeIdeal('phosphorus', 70),
                    sulfur: normalizeIdeal('sulfur', 20),
                    zinc: normalizeIdeal('zinc', 8),
                    iron: normalizeIdeal('iron', 12),
                    manganese: normalizeIdeal('manganese', 8),
                    copper: normalizeIdeal('copper', 3),
                    potassium: normalizeIdeal('potassium', 210),
                    calcium: normalizeIdeal('calcium', 1800),
                    magnesium: normalizeIdeal('magnesium', 280),
                    sodium: normalizeIdeal('sodium', 30),
                };

                setIdeals(idealsData);

                // Calculate summary stats
                if (chartData.length > 0) {
                    const latest = chartData[chartData.length - 1];
                    const metrics = ['phosphorus', 'sulfur', 'zinc', 'iron', 'manganese', 'copper', 'potassium', 'calcium', 'magnesium'];
                    const avgNutrient = metrics.reduce((sum, key) => sum + (latest[key] || 0), 0) / metrics.length;
                    setSummaryData({
                        overallHealth: Math.round((latest.moisture / idealsData.moisture) * 100),
                        avgNutrient: Math.round(avgNutrient),
                        lastUpdate: latest.timestamp
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

    const metrics = [
        { key: 'phosphorus', label: 'Phosphorus Levels' },
        { key: 'sulfur', label: 'Sulfur Levels' },
        { key: 'zinc', label: 'Zinc Levels' },
        { key: 'iron', label: 'Iron Levels' },
        { key: 'manganese', label: 'Manganese Levels' },
        { key: 'copper', label: 'Copper Levels' },
        { key: 'potassium', label: 'Potassium Levels' },
        { key: 'calcium', label: 'Calcium Levels' },
        { key: 'magnesium', label: 'Magnesium Levels' },
        { key: 'sodium', label: 'Sodium Levels' }
    ];

    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center' }}>Loading soil data...</div>;
    }

    return (
        <div style={{
            padding: 24,
            background: '#f5f5f5',
            minHeight: '100vh',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>Nutrient Dashboard</h1>
            </div>

            {/* Summary Overview */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Summary Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div style={{
                        background: 'white',
                        padding: 20,
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Overall Health Score</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#1976d2' }}>
                            {summaryData.overallHealth}%
                        </div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Smart progress this month</div>
                    </div>
                    <div style={{
                        background: 'white',
                        padding: 20,
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Average Nutrient Level</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#4caf50' }}>
                            {summaryData.avgNutrient}%
                        </div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Consistent performance</div>
                    </div>
                    <div style={{
                        background: 'white',
                        padding: 20,
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Last Report Updated</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#ff9800' }}>
                            {summaryData.lastUpdate ? new Date(summaryData.lastUpdate).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            }).replace(' ', '') : '-'}
                        </div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>All systems operational</div>
                    </div>
                </div>
            </div>

            {/* Nutrient Performance Grid */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Nutrient Performance</h2>
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
                    {metrics.map(metric => (
                        <MetricChart
                            key={metric.key}
                            data={data}
                            metricKey={metric.key}
                            metricLabel={metric.label}
                            idealValue={ideals[metric.key]}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

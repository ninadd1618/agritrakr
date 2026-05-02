import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import Navbar from "../../Navbar/Navbar";
import Datepicker from "../../DateTimePicker/DatePicker";
import styled from "styled-components";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '@config/api';
import { useSelector } from 'react-redux';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const TopBar = styled(Box)`
  background-color: hsl(0deg 0% 95.29%);
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
`;

const NameAndDateSection = styled(Box)`
  display: flex;
  align-items: center;
  gap: 32px;

  @media (max-width: 768px) {
    width: 100%;
    gap: 16px;
  }
`;

const NameSection = styled(Box)`
  display: flex;
  flex-direction: column;
    justify-content: center;
    align-items: center;

  .value {
    font-size: 18px;
    font-weight: 700;
    color: #0f2765;
        text-align: center;
  }
`;

const DateSection = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 12px;
    color: #999;
    font-weight: 600;
    text-transform: uppercase;
  }

  .date-range {
    font-size: 14px;
    font-weight: 600;
    color: #0f2765;
  }
`;

const Header = styled(Box)`
  background-color: hsl(0deg 0% 95.29%);
  position: sticky;
  top: 70px;   /* sit below the global fixed green header (70px tall) */
  width: 100%;
  z-index: 5;
  padding: 0% 2% 0% 1%;
  height: 70px;
  align-items: center;
  display: flex;
  justify-content: space-between;

  @media (max-width: 768px) {
    padding: 0 12px;
    top: 60px;  /* mobile header is 60px */
  }
`;

const GridContainer = styled.div`
  padding-top: 70px;  /* clear the global fixed header */
  display: block;
  min-height: 100vh;
  justify-content: center;
  width: 100%;
  position: relative;

  @media (max-width: 768px) {
    padding-top: 60px;
    width: 100%;
  }
`;

function formatDate(d) {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Download Excel report with status overview for each environmental condition
const downloadExcelReport = async (data, ideals, summaryData) => {
    if (!data || data.length === 0) return;
    
    const workbook = new ExcelJS.Workbook();
    
    // Helper function to calculate status
    const getStatus = (value, ideal) => {
        if (value == null || ideal == null || ideal === 0) return 'N/A';
        const deviation = Math.abs(value - ideal);
        if (deviation < ideal * 0.1) return 'Good';
        if (deviation < ideal * 0.2) return 'Warning';
        return 'Critical';
    };
    
    // Helper function to get indicator symbol
    const getIndicator = (value, ideal) => {
        if (value == null || ideal == null || ideal === 0) return '⚫';
        const deviation = Math.abs(value - ideal);
        if (deviation < ideal * 0.1) return '🟢';
        if (deviation < ideal * 0.2) return '🟡';
        return '🔴';
    };
    
    // Helper function to calculate deviation percentage
    const getDeviation = (value, ideal) => {
        if (value == null || ideal == null || ideal === 0) return 'N/A';
        const deviation = ((value - ideal) / ideal) * 100;
        return `${deviation >= 0 ? '+' : ''}${deviation.toFixed(1)}%`;
    };
    
    // Helper to apply status color
    const applyStatusColor = (cell) => {
        const cellText = cell.value?.toString() || '';
        if (cellText === 'Good' || cellText.includes('🟢')) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        } else if (cellText === 'Warning' || cellText.includes('🟡')) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC107' } };
            cell.font = { bold: true };
        } else if (cellText === 'Critical' || cellText.includes('🔴')) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF44336' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        }
    };
    
    // Sort data by timestamp (newest first)
    const sortedData = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Sheet 1: Summary Overview
    const summarySheet = workbook.addWorksheet('Summary Overview');
    summarySheet.addRow(['Dashboard Summary Report']);
    summarySheet.addRow(['Generated:', new Date().toLocaleString()]);
    summarySheet.addRow(['Date Range:', `${sortedData.length > 0 ? new Date(sortedData[sortedData.length-1].timestamp).toLocaleDateString('en-GB') : ''} to ${sortedData.length > 0 ? new Date(sortedData[0].timestamp).toLocaleDateString('en-GB') : ''}`]);
    summarySheet.addRow([]);
    summarySheet.addRow(['Key Metrics', 'Value', 'Status']);
    summarySheet.addRow(['Soil Health Score', `${summaryData.overallHealth || 0}%`, summaryData.overallHealth >= 80 ? 'Good' : summaryData.overallHealth >= 60 ? 'Warning' : 'Critical']);
    summarySheet.addRow(['Average Nutrient Level', `${summaryData.avgNutrient || 0}%`, parseFloat(summaryData.avgNutrient) >= 80 ? 'Good' : parseFloat(summaryData.avgNutrient) >= 60 ? 'Warning' : 'Critical']);
    summarySheet.addRow(['Soil Moisture', `${summaryData.moisture?.toFixed(1) || 0}%`, getStatus(summaryData.moisture, ideals.moisture)]);
    summarySheet.addRow(['Soil pH Level', summaryData.pH?.toFixed(1) || 0, getStatus(summaryData.pH, ideals.pH)]);
    summarySheet.addRow(['Soil Temperature', `${summaryData.temp?.toFixed(1) || 0}°C`, getStatus(summaryData.temp, ideals.temperature)]);
    summarySheet.addRow([]);
    summarySheet.addRow(['Status Overview', 'Count']);
    summarySheet.addRow(['Good', summaryData.goodCount || 0]);
    summarySheet.addRow(['Warning', summaryData.warningCount || 0]);
    summarySheet.addRow(['Critical', summaryData.criticalCount || 0]);
    summarySheet.addRow(['Total Metrics', (summaryData.goodCount || 0) + (summaryData.warningCount || 0) + (summaryData.criticalCount || 0)]);
    
    // Style the summary sheet
    summarySheet.getRow(1).font = { bold: true, size: 16 };
    summarySheet.getRow(5).font = { bold: true };
    summarySheet.getRow(12).font = { bold: true };
    
    // Apply status colors to summary
    [6, 7, 8, 9, 10].forEach(rowNum => {
        applyStatusColor(summarySheet.getRow(rowNum).getCell(3));
    });
    
    // Sheet 2: Environmental Conditions with Status and Indicator
    const envSheet = workbook.addWorksheet('Environmental Conditions');
    envSheet.addRow(['Date', 
        'Moisture (%)', 'Moisture Ideal', 'Moisture Indicator', 'Moisture Status', 'Moisture Deviation', 
        'pH', 'pH Ideal', 'pH Indicator', 'pH Status', 'pH Deviation',
        'Temperature (°C)', 'Temp Ideal', 'Temp Indicator', 'Temp Status', 'Temp Deviation']);
    envSheet.getRow(1).font = { bold: true };
    envSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
    envSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    const moistureIdeal = ideals.moisture || 50;
    const pHIdeal = ideals.pH || 6.5;
    const tempIdeal = ideals.temperature || 20;
    
    sortedData.forEach(d => {
        envSheet.addRow([
            new Date(d.timestamp).toLocaleDateString('en-GB'),
            d.moisture?.toFixed(1) || '',
            moistureIdeal,
            getIndicator(d.moisture, moistureIdeal),
            getStatus(d.moisture, moistureIdeal),
            getDeviation(d.moisture, moistureIdeal),
            d.pH?.toFixed(2) || '',
            pHIdeal,
            getIndicator(d.pH, pHIdeal),
            getStatus(d.pH, pHIdeal),
            getDeviation(d.pH, pHIdeal),
            d.temperature?.toFixed(1) || '',
            tempIdeal,
            getIndicator(d.temperature, tempIdeal),
            getStatus(d.temperature, tempIdeal),
            getDeviation(d.temperature, tempIdeal)
        ]);
    });
    
    // Apply conditional formatting colors for environmental status columns
    envSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            [5, 10, 15].forEach(colIndex => { // Status columns (shifted due to indicator columns)
                applyStatusColor(row.getCell(colIndex));
            });
        }
    });
    
    // Sheet 3: All Nutrients with Status, Indicator and Deviation
    const nutrientSheet = workbook.addWorksheet('Nutrients Performance');
    nutrientSheet.addRow(['Date', 
        'Nitrogen', 'N Ideal', 'N Indicator', 'N Status', 'N Deviation',
        'Phosphorus', 'P Ideal', 'P Indicator', 'P Status', 'P Deviation',
        'Potassium', 'K Ideal', 'K Indicator', 'K Status', 'K Deviation',
        'Sulfur', 'S Ideal', 'S Indicator', 'S Status', 'S Deviation',
        'Calcium', 'Ca Ideal', 'Ca Indicator', 'Ca Status', 'Ca Deviation',
        'Magnesium', 'Mg Ideal', 'Mg Indicator', 'Mg Status', 'Mg Deviation',
        'Iron', 'Fe Ideal', 'Fe Indicator', 'Fe Status', 'Fe Deviation',
        'Zinc', 'Zn Ideal', 'Zn Indicator', 'Zn Status', 'Zn Deviation',
        'Manganese', 'Mn Ideal', 'Mn Indicator', 'Mn Status', 'Mn Deviation',
        'Copper', 'Cu Ideal', 'Cu Indicator', 'Cu Status', 'Cu Deviation'
    ]);
    nutrientSheet.getRow(1).font = { bold: true };
    nutrientSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
    nutrientSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    sortedData.forEach(d => {
        nutrientSheet.addRow([
            new Date(d.timestamp).toLocaleDateString('en-GB'),
            d.nitrogen || '', ideals.nitrogen || '', getIndicator(d.nitrogen, ideals.nitrogen), getStatus(d.nitrogen, ideals.nitrogen), getDeviation(d.nitrogen, ideals.nitrogen),
            d.phosphorus || '', ideals.phosphorus || '', getIndicator(d.phosphorus, ideals.phosphorus), getStatus(d.phosphorus, ideals.phosphorus), getDeviation(d.phosphorus, ideals.phosphorus),
            d.potassium || '', ideals.potassium || '', getIndicator(d.potassium, ideals.potassium), getStatus(d.potassium, ideals.potassium), getDeviation(d.potassium, ideals.potassium),
            d.sulfur || '', ideals.sulfur || '', getIndicator(d.sulfur, ideals.sulfur), getStatus(d.sulfur, ideals.sulfur), getDeviation(d.sulfur, ideals.sulfur),
            d.calcium || '', ideals.calcium || '', getIndicator(d.calcium, ideals.calcium), getStatus(d.calcium, ideals.calcium), getDeviation(d.calcium, ideals.calcium),
            d.magnesium || '', ideals.magnesium || '', getIndicator(d.magnesium, ideals.magnesium), getStatus(d.magnesium, ideals.magnesium), getDeviation(d.magnesium, ideals.magnesium),
            d.iron || '', ideals.iron || '', getIndicator(d.iron, ideals.iron), getStatus(d.iron, ideals.iron), getDeviation(d.iron, ideals.iron),
            d.zinc || '', ideals.zinc || '', getIndicator(d.zinc, ideals.zinc), getStatus(d.zinc, ideals.zinc), getDeviation(d.zinc, ideals.zinc),
            d.manganese || '', ideals.manganese || '', getIndicator(d.manganese, ideals.manganese), getStatus(d.manganese, ideals.manganese), getDeviation(d.manganese, ideals.manganese),
            d.copper || '', ideals.copper || '', getIndicator(d.copper, ideals.copper), getStatus(d.copper, ideals.copper), getDeviation(d.copper, ideals.copper)
        ]);
    });
    
    // Apply conditional formatting for nutrient status columns (every 5th column starting from 5)
    nutrientSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            [5, 10, 15, 20, 25, 30, 35, 40, 45, 50].forEach(colIndex => { // Status columns
                applyStatusColor(row.getCell(colIndex));
            });
        }
    });
    
    // Sheet 4: Status Summary per Date with Indicator
    const statusSummarySheet = workbook.addWorksheet('Daily Status Summary');
    statusSummarySheet.addRow(['Date', 'Good Count', 'Warning Count', 'Critical Count', 'Indicator', 'Overall Status']);
    statusSummarySheet.getRow(1).font = { bold: true };
    statusSummarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
    statusSummarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    sortedData.forEach(d => {
        let good = 0, warning = 0, critical = 0;
        
        // Count environmental conditions
        ['moisture', 'pH', 'temperature'].forEach(key => {
            const ideal = key === 'moisture' ? moistureIdeal : key === 'pH' ? pHIdeal : tempIdeal;
            const status = getStatus(d[key], ideal);
            if (status === 'Good') good++;
            else if (status === 'Warning') warning++;
            else if (status === 'Critical') critical++;
        });
        
        // Count nutrients
        ['nitrogen', 'phosphorus', 'potassium', 'sulfur', 'calcium', 'magnesium', 'iron', 'zinc', 'manganese', 'copper'].forEach(key => {
            const status = getStatus(d[key], ideals[key]);
            if (status === 'Good') good++;
            else if (status === 'Warning') warning++;
            else if (status === 'Critical') critical++;
        });
        
        const overallStatus = critical > 0 ? 'Critical' : warning > 0 ? 'Warning' : 'Good';
        const overallIndicator = critical > 0 ? '🔴' : warning > 0 ? '🟡' : '🟢';
        
        statusSummarySheet.addRow([
            new Date(d.timestamp).toLocaleDateString('en-GB'),
            good,
            warning,
            critical,
            overallIndicator,
            overallStatus
        ]);
    });
    
    // Apply status colors to daily summary
    statusSummarySheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            applyStatusColor(row.getCell(6)); // Overall Status column (shifted due to indicator)
        }
    });
    
    // Auto-fit columns for all sheets
    [summarySheet, envSheet, nutrientSheet, statusSummarySheet].forEach(sheet => {
        sheet.columns.forEach(column => {
            column.width = 14;
        });
    });
    
    // Download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'soil-dashboard-report.xlsx');
};

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
    // Get dates from Redux store for filtering
    const dates = useSelector((state) => state.datePicker.dates);
    
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
                // Build URL with date range parameters
                const params = new URLSearchParams();
                if (dates && dates[0]) params.append('start', dates[0]);
                if (dates && dates[1]) params.append('end', dates[1]);
                params.append('limit', '500');
                
                const res = await apiClient.get(`/api/v1/soil/data?${params.toString()}`);
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

                const idealsRes = await apiClient.get('/api/v1/soil/ideals');
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

                    // SHI = sum(score_i * weight_i), with score_i on a 1-4 scale.
                    const shiIndicators = ['moisture', 'pH', 'nitrogen', 'phosphorus', 'potassium'];
                    const indicatorWeights = {
                        moisture: 0.2,
                        pH: 0.2,
                        nitrogen: 0.2,
                        phosphorus: 0.2,
                        potassium: 0.2,
                    };
                    const scoreIndicator = (value, ideal) => {
                        const deviationPercent = (Math.abs(value - ideal) / ideal) * 100;
                        if (deviationPercent <= 5) return 4; // excellent
                        if (deviationPercent <= 10) return 3; // good
                        if (deviationPercent <= 20) return 2; // fair
                        return 1; // poor
                    };

                    let weightedScore = 0;
                    let totalWeight = 0;
                    shiIndicators.forEach((key) => {
                        const value = getLastValue(key);
                        const ideal = idealsData[key];
                        if (value == null || ideal == null || ideal === 0) return;
                        const weight = indicatorWeights[key] ?? 1;
                        weightedScore += scoreIndicator(value, ideal) * weight;
                        totalWeight += weight;
                    });

                    const overallHealth = totalWeight > 0
                        ? Math.round(((weightedScore / totalWeight) / 4) * 100)
                        : null;

                    const moistureVal = getLastValue('moisture');
                    const pHVal = getLastValue('pH');
                    const tempVal = getLastValue('temperature');

                    setSummaryData({
                        overallHealth: overallHealth,
                        avgNutrient: avgNutrient != null ? (Math.round(avgNutrient * 10) / 10).toFixed(1) : null,
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
    }, [dates]); // Re-fetch when dates change

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

    // Format date range for display in top bar
    const formatDateRange = () => {
        if (!dates || dates.length < 2) {
            return "All Dates";
        }
        const startDate = new Date(dates[0]);
        const endDate = new Date(dates[1]);
        const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${startFormatted} -> ${endFormatted}`;
    };

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
            <div style={{
                padding: 24,
                background: 'white',
                minHeight: '100vh',
                marginTop: 0,
                boxSizing: 'border-box',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                {/* Top Bar with Name and Date Section */}
                <TopBar>
                    <NameAndDateSection>
                        <NameSection>
                            <div className="value">Dashboard</div>
                        </NameSection>
                        <DateSection>
                            <div className="label">Date Range</div>
                            <div className="date-range">{formatDateRange()}</div>
                        </DateSection>
                    </NameAndDateSection>
                    <Box sx={{ color: '#2e7d32' }}>
                        <Datepicker />
                    </Box>
                </TopBar>

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
                            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Based on weighted SHI formula</div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Environmental Conditions</h2>
                        <button
                            onClick={() => downloadExcelReport(data, ideals, summaryData)}
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
                    <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Nutrient Performance Analysis</h2>
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

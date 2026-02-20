import { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import PlantReport from '../../Reports/utility/plantReport';
import Datepicker from '../../../DateTimePicker/DatePicker';
// Note: SoilTableView intentionally removed per request

import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { toast } from 'react-toastify';



const Component = styled(Box)`
  margin-top: 7%;
  margin-left: 2%;
  justify-content: center;
  height: auto;
  margin-bottom: 2% !important;

  @media (max-width: 600px) {
    margin-top: 20%;
    margin-left: 5%;
  }
`;

const Header = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin: 16px 0;
`;

const Card = styled.div`
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.15);
  border: 1px solid #c8e6c9;
`;

const Container = styled(Box)`
  padding: 20px;
  max-width: 100%;
  margin: 0 auto;

  @media (min-width: 650px) {
    max-width: 1200px;
  }

  @media (max-width: 650px) {
    padding: 10px;
  }
`;

// Helper function to determine status based on thresholds
const getMetricStatus = (metric, value, idealValue = null) => {
  if (value === null || value === undefined) return { status: 'N/A', color: '#9e9e9e', bgColor: '#f5f5f5' };
  
  switch (metric) {
    case 'avgNutrient':
      // Percentage-based: >=90% Good, 80-90% Warning, <80% Critical
      if (value >= 90) return { status: 'Good', color: '#4caf50', bgColor: '#e8f5e9' };
      if (value >= 80) return { status: 'Warning', color: '#ff9800', bgColor: '#fff3e0' };
      return { status: 'Critical', color: '#f44336', bgColor: '#ffebee' };
    
    case 'soilPH':
      // Ideal pH is 6.0-7.5
      if (value >= 6.0 && value <= 7.5) return { status: 'Good', color: '#4caf50', bgColor: '#e8f5e9' };
      if (value >= 5.5 && value <= 8.0) return { status: 'Warning', color: '#ff9800', bgColor: '#fff3e0' };
      return { status: 'Critical', color: '#f44336', bgColor: '#ffebee' };
    
    case 'nitrogen':
      // Nitrogen proxy (phosphorus): ideal ~70 ppm, ±10% Good, 10-20% Warning, >20% Critical
      const nitrogenIdeal = idealValue || 70;
      const nitrogenDeviation = Math.abs(value - nitrogenIdeal) / nitrogenIdeal;
      if (nitrogenDeviation <= 0.1) return { status: 'Good', color: '#4caf50', bgColor: '#e8f5e9' };
      if (nitrogenDeviation <= 0.2) return { status: 'Warning', color: '#ff9800', bgColor: '#fff3e0' };
      return { status: 'Critical', color: '#f44336', bgColor: '#ffebee' };
    
    case 'waterUsage':
      // Water usage: lower is better. <ideal Good, ideal-1.5x Warning, >1.5x Critical
      const waterIdeal = idealValue || 500;
      if (value <= waterIdeal) return { status: 'Good', color: '#4caf50', bgColor: '#e8f5e9' };
      if (value <= waterIdeal * 1.5) return { status: 'Warning', color: '#ff9800', bgColor: '#fff3e0' };
      return { status: 'Critical', color: '#f44336', bgColor: '#ffebee' };
    
    case 'diseaseIncidence':
      // Disease: lower is better. <5% Good, 5-15% Warning, >15% Critical
      if (value < 5) return { status: 'Good', color: '#4caf50', bgColor: '#e8f5e9' };
      if (value <= 15) return { status: 'Warning', color: '#ff9800', bgColor: '#fff3e0' };
      return { status: 'Critical', color: '#f44336', bgColor: '#ffebee' };
    
    default:
      return { status: 'N/A', color: '#9e9e9e', bgColor: '#f5f5f5' };
  }
};

// Status badge component
const StatusBadge = ({ status, color, bgColor }) => (
  <span style={{
    padding: '4px 10px',
    borderRadius: 12,
    background: bgColor,
    color: color,
    fontWeight: 600,
    fontSize: 11,
    marginLeft: 8,
  }}>
    {status}
  </span>
);

const QualityController = () => {
  const dates = useSelector((state) => state.datePicker.dates);
  // Default date range: January 1 - February 20, 2026 (matching seeded data)
  const defaultStart = new Date('2026-01-01T00:00:00.000Z');
  const defaultEnd = new Date('2026-02-20T23:59:59.000Z');
  const startDate = dates?.[0] || defaultStart.toISOString();
  const endDate = dates?.[1] || defaultEnd.toISOString();
  const [summary, setSummary] = useState({
    avgNutrient: null,
    soilPH: null,
    nitrogen: null,
    waterUsage: null,
    diseaseIncidence: null,
    avgDelta: null,
  });

  // Fetch both soil and plant data together to avoid flickering
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        console.log('QualityController - Fetching with dates:', startDate, 'to', endDate);
        // Fetch soil data
        const soilUrl = `/api/v1/soil/data?limit=500&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
        const soilRes = await axios.get(soilUrl);
        const rows = soilRes.data?.data || [];

        // Fetch ideal values
        const idealsRes = await axios.get('/api/v1/soil/ideals');
        const idealsData = idealsRes.data?.data || {};

        console.log('QualityController - Rows:', rows.length, 'Ideals:', idealsData);

        let avgNutrient = null, soilPH = null, nitrogen = null, avgDelta = null;
        let goodCount = 0, warningCount = 0, criticalCount = 0;

        if (rows.length) {
          // compute average of ALL nutrients as percentage of ideal values, capped at 100%
          // Using same nutrients as Dashboard for consistency
          const nutrientKeys = ['nitrogen', 'phosphorus', 'sulfur', 'zinc', 'iron', 'manganese', 'copper', 'potassium', 'calcium', 'magnesium'];
          // Data is sorted descending by timestamp from API, so index 0 is newest (latest)
          const latest = rows[0];

          console.log('QualityController - Latest row:', latest);

          // Calculate average nutrient as percentage
          const nutrientPercentages = [];
          nutrientKeys.forEach(key => {
            const value = latest[key];
            const ideal = idealsData[key];
            console.log(`QualityController - ${key}: value=${value}, ideal=${ideal}`);
            if (ideal && ideal > 0 && value != null && value > 0) {
              const percentage = (value / ideal) * 100;
              nutrientPercentages.push(Math.min(percentage, 100)); // Cap at 100%
            }
          });

          if (nutrientPercentages.length > 0) {
            avgNutrient = nutrientPercentages.reduce((sum, pct) => sum + pct, 0) / nutrientPercentages.length;
            avgNutrient = +avgNutrient.toFixed(1);
          } else {
            avgNutrient = null;
          }

          console.log('QualityController - Nutrient Percentages:', nutrientPercentages, 'Avg:', avgNutrient);

          // Count metrics by status (Good, Warning, Critical) - using all nutrients
          nutrientKeys.forEach(key => {
            const value = latest[key];
            const ideal = idealsData[key];
            if (ideal && ideal > 0 && value != null) {
              const deviation = Math.abs(value - ideal);
              if (deviation >= ideal * 0.2) criticalCount++;
              else if (deviation >= ideal * 0.1) warningCount++;
              else goodCount++;
            }
          });

          console.log('QualityController - Status Counts:', { goodCount, warningCount, criticalCount });

          // soil pH: use latest reading
          soilPH = latest?.pH ?? null;

          // nitrogen proxy: use latest phosphorus
          nitrogen = latest?.phosphorus ?? null;

          // compute a simple delta: compare last half average vs previous half average if enough data
          if (rows.length >= 14) {
            const half = Math.floor(rows.length / 2);
            const first = rows.slice(0, half);
            const second = rows.slice(half);
            const avgFor = (arr) => {
              let s = 0, c = 0;
              arr.forEach(r => {
                nutrientKeys.forEach(k => {
                  const v = r[k]; if (typeof v === 'number') { s += v; c += 1; }
                });
              });
              return c > 0 ? s / c : null;
            };
            const a1 = avgFor(first);
            const a2 = avgFor(second);
            if (a1 !== null && a2 !== null && a1 !== 0) {
              avgDelta = +(((a2 - a1) / a1) * 100).toFixed(1);
            }
          }
        }

        // Fetch plant data
        const plantRes = await axios.get(`/api/v1/reports/plant?start=${encodeURIComponent(startDate)}&stop=${encodeURIComponent(endDate)}`);
        const plantData = plantRes.data?.data || [];

        // Calculate water usage based on estimated yield
        let waterUsage = null;
        if (plantData.length) {
          const avgYield = plantData.reduce((sum, r) => sum + (r.estimatedYield || 0), 0) / plantData.length;
          waterUsage = +(avgYield * 0.5).toFixed(0);
        }

        // Calculate disease incidence from health status
        let diseaseIncidence = null;
        if (plantData.length) {
          const diseased = plantData.filter(r =>
            r.healthStatus && /disease|unhealthy|poor/i.test(String(r.healthStatus))
          ).length;
          diseaseIncidence = +((diseased / plantData.length) * 100).toFixed(1);
        }

        // Update all values at once to prevent flickering
        setSummary({
          avgNutrient,
          soilPH,
          nitrogen,
          waterUsage,
          diseaseIncidence,
          avgDelta,
          goodCount,
          warningCount,
          criticalCount
        });

      } catch (err) {
        console.error('Failed to fetch data for summary', err);
      }
    };

    fetchAllData();
  }, [startDate, endDate]);

  // Export combined report as Excel workbook
  const exportReport = async () => {
    try {
      const start = dates?.[0] || startDate;
      const stop = dates?.[1] || endDate;

      // Fetch local plant data
      const plantRes = await axios.get(`/api/v1/reports/plant?start=${encodeURIComponent(start)}&stop=${encodeURIComponent(stop)}`);
      const soilRes = await axios.get('/api/v1/soil/data?limit=500');

      const plantData = plantRes.data?.data || [];
      const soilData = soilRes.data?.data || [];

      const wb = new ExcelJS.Workbook();

      // Summary sheet with status for each metric
      const summarySheet = wb.addWorksheet('Summary');
      
      // Add headers with styling
      const headerRow = summarySheet.addRow(['Metric', 'Value', 'Status']);
      headerRow.font = { bold: true };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      
      // Get status for each metric
      const avgNutrientStatus = getMetricStatus('avgNutrient', summary.avgNutrient);
      const soilPHStatus = getMetricStatus('soilPH', summary.soilPH);
      const nitrogenStatus = getMetricStatus('nitrogen', summary.nitrogen);
      const waterUsageStatus = getMetricStatus('waterUsage', summary.waterUsage);
      const diseaseStatus = getMetricStatus('diseaseIncidence', summary.diseaseIncidence);
      
      // Add rows with values and status
      const addMetricRow = (sheet, metric, value, status) => {
        const row = sheet.addRow([metric, value, status.status]);
        // Color the status cell based on status
        const statusCell = row.getCell(3);
        if (status.status === 'Good') {
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
          statusCell.font = { color: { argb: 'FF4CAF50' }, bold: true };
        } else if (status.status === 'Warning') {
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
          statusCell.font = { color: { argb: 'FFFF9800' }, bold: true };
        } else if (status.status === 'Critical') {
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
          statusCell.font = { color: { argb: 'FFF44336' }, bold: true };
        }
        return row;
      };
      
      addMetricRow(summarySheet, 'Average Nutrient (%)', summary.avgNutrient ?? '-', avgNutrientStatus);
      addMetricRow(summarySheet, 'Soil pH', summary.soilPH ?? '-', soilPHStatus);
      addMetricRow(summarySheet, 'Nitrogen (proxy)', summary.nitrogen ?? '-', nitrogenStatus);
      addMetricRow(summarySheet, 'Water Usage', summary.waterUsage ?? '-', waterUsageStatus);
      addMetricRow(summarySheet, 'Disease Incidence (%)', summary.diseaseIncidence ?? '-', diseaseStatus);
      
      summarySheet.addRow([]);  // Empty row for spacing
      
      // Status Summary counts
      const statusHeaderRow = summarySheet.addRow(['Status Summary', '', '']);
      statusHeaderRow.font = { bold: true };
      summarySheet.addRow(['Good', summary.goodCount ?? 0, '']);
      summarySheet.addRow(['Warning', summary.warningCount ?? 0, '']);
      summarySheet.addRow(['Critical', summary.criticalCount ?? 0, '']);
      
      // Set column widths
      summarySheet.getColumn(1).width = 25;
      summarySheet.getColumn(2).width = 15;
      summarySheet.getColumn(3).width = 12;

      // Plant/Crop report sheet
      const plantSheet = wb.addWorksheet('CropYieldHealthData');
      if (plantData.length) {
        plantSheet.addRow(Object.keys(plantData[0]));
        plantData.forEach(r => plantSheet.addRow(Object.values(r)));
      } else {
        plantSheet.addRow(['No plant data available']);
      }

      // Soil data sheet
      const soilSheet = wb.addWorksheet('SoilData');
      if (soilData.length) {
        soilSheet.addRow(Object.keys(soilData[0]));
        soilData.forEach(r => soilSheet.addRow(Object.values(r)));
      } else {
        soilSheet.addRow(['No soil data available']);
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const filename = `farm-performance-report-${new Date(start).toLocaleDateString('en-US')}-to-${new Date(stop).toLocaleDateString('en-US')}.xlsx`;
      saveAs(blob, filename);
      toast.success('Report exported successfully!');
    } catch (err) {
      console.error('Export failed', err);
      toast.error(`Export failed: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <Component>
      <Header>
        <Typography
          sx={{
            fontSize: { xs: 24, sm: 30 },
            fontWeight: 700,
            color: "#1b5e20",
          }}
        >
          Farm Performance Report
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', marginTop: 1 }}>
          <Datepicker />
          <Button variant="contained" sx={{
            marginLeft: 'auto',
            background: 'linear-gradient(135deg, #66bb6a 0%, #aed581 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4caf50 0%, #9ccc65 100%)',
            }
          }} onClick={exportReport}>Download Report</Button>
        </Box>
      </Header>

      <Container>
        {/* Top Summary cards - Average Nutrient and Status Overview */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2, marginBottom: 3 }}>
          <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 12, color: '#2e7d32' }}>Average Nutrient</Typography>
                  <StatusBadge {...getMetricStatus('avgNutrient', summary.avgNutrient)} />
                </Box>
                <Typography sx={{ fontSize: 32, fontWeight: 700, color: '#1b5e20' }}>{summary.avgNutrient !== null ? `${summary.avgNutrient}%` : '-'}</Typography>
                <Typography sx={{ fontSize: 12, color: '#66bb6a' }}>All nutrients combined</Typography>
              </div>
              <div>
                {summary.avgDelta !== null ? (
                  <div style={{ padding: '6px 10px', borderRadius: 12, background: summary.avgDelta >= 0 ? '#c8e6c9' : '#ffebee', color: summary.avgDelta >= 0 ? '#1b5e20' : '#c62828', fontWeight: 700 }}>
                    {summary.avgDelta >= 0 ? '▲' : '▼'} {Math.abs(summary.avgDelta)}%
                  </div>
                ) : (
                  <div style={{ padding: '6px 10px', borderRadius: 12, background: '#e8f5e8', color: '#2e7d32', fontWeight: 600 }}>
                    N/A
                  </div>
                )}
              </div>
            </Box>
          </Card>

          <Card>
            <Typography sx={{ fontSize: 12, color: '#2e7d32', marginBottom: 1 }}>Status Overview</Typography>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: 32, fontWeight: 700, color: '#4caf50' }}>{summary.goodCount || 0}</Typography>
                <Typography sx={{ fontSize: 12, color: '#66bb6a' }}>Good</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: 32, fontWeight: 700, color: '#ff9800' }}>{summary.warningCount || 0}</Typography>
                <Typography sx={{ fontSize: 12, color: '#ffb74d' }}>Warning</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: 32, fontWeight: 700, color: '#f44336' }}>{summary.criticalCount || 0}</Typography>
                <Typography sx={{ fontSize: 12, color: '#e57373' }}>Critical</Typography>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Other Summary cards with Status Badges */}
        <CardsGrid>
          <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 12, color: '#2e7d32' }}>Soil pH</Typography>
              <StatusBadge {...getMetricStatus('soilPH', summary.soilPH)} />
            </Box>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1b5e20' }}>{summary.soilPH !== null ? summary.soilPH.toFixed(1) : '-'}</Typography>
            <Typography sx={{ fontSize: 12, color: '#66bb6a' }}>Ideal: 6.0 - 7.5</Typography>
          </Card>
          <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 12, color: '#2e7d32' }}>Nitrogen (proxy)</Typography>
              <StatusBadge {...getMetricStatus('nitrogen', summary.nitrogen)} />
            </Box>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1b5e20' }}>{summary.nitrogen !== null ? `${summary.nitrogen} ppm` : '-'}</Typography>
            <Typography sx={{ fontSize: 12, color: '#66bb6a' }}>Ideal: ~70 ppm</Typography>
          </Card>
          <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 12, color: '#2e7d32' }}>Water Usage</Typography>
              <StatusBadge {...getMetricStatus('waterUsage', summary.waterUsage)} />
            </Box>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1b5e20' }}>{summary.waterUsage !== null ? `${summary.waterUsage} gal/acre` : '-'}</Typography>
            <Typography sx={{ fontSize: 12, color: '#66bb6a' }}>Lower is better</Typography>
          </Card>
          <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 12, color: '#2e7d32' }}>Disease Incidence</Typography>
              <StatusBadge {...getMetricStatus('diseaseIncidence', summary.diseaseIncidence)} />
            </Box>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1b5e20' }}>{summary.diseaseIncidence !== null ? `${summary.diseaseIncidence}%` : '-'}</Typography>
            <Typography sx={{ fontSize: 12, color: '#66bb6a' }}>Ideal: &lt;5%</Typography>
          </Card>
        </CardsGrid>

        {/* Crop Yield & Health Data table (use existing PlantReport table) */}
        <Box sx={{ marginTop: 3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, marginBottom: 1 }}>Crop Yield & Health Data</Typography>
          <PlantReport dates={dates || []} />
        </Box>

        {/* Soil Nutrient Analysis table intentionally omitted per request */}
      </Container>
    </Component>
  );
};

export default QualityController;

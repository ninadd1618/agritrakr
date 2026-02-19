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

const QualityController = () => {
  const dates = useSelector((state) => state.datePicker.dates);
  // Provide sensible default date range (last 30 days) so tables populate even when no picker is set
  const defaultEnd = new Date();
  const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
        // Fetch soil data
        const soilUrl = `/api/v1/soil/data?limit=200&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
        const soilRes = await axios.get(soilUrl);
        const rows = soilRes.data?.data || [];

        // Fetch ideal values
        const idealsRes = await axios.get('/api/v1/soil/ideals');
        const idealsData = idealsRes.data?.data || {};

        console.log('QualityController - Rows:', rows.length, 'Ideals:', idealsData);

        let avgNutrient = null, soilPH = null, nitrogen = null, avgDelta = null;
        let goodCount = 0, warningCount = 0, criticalCount = 0;

        if (rows.length) {
          // compute average of selected nutrients as percentage of ideal values, capped at 100%
          const nutrientKeys = ['phosphorus', 'potassium', 'calcium', 'magnesium', 'sulfur'];
          const latest = rows[rows.length - 1];

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

          // Count metrics by status (Good, Warning, Critical)
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

      // Summary sheet
      const summarySheet = wb.addWorksheet('Summary');
      summarySheet.addRow(['Metric', 'Value']);
      summarySheet.addRow(['Average Nutrient (%)', summary.avgNutrient ?? '-']);
      summarySheet.addRow(['Soil pH', summary.soilPH ?? '-']);
      summarySheet.addRow(['Nitrogen (proxy)', summary.nitrogen ?? '-']);
      summarySheet.addRow(['Water Usage', summary.waterUsage ?? '-']);
      summarySheet.addRow(['Disease Incidence (%)', summary.diseaseIncidence ?? '-']);
      summarySheet.addRow([]);  // Empty row for spacing
      summarySheet.addRow(['Status Overview', '']);
      summarySheet.addRow(['Good', summary.goodCount ?? 0]);
      summarySheet.addRow(['Warning', summary.warningCount ?? 0]);
      summarySheet.addRow(['Critical', summary.criticalCount ?? 0]);

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
                <Typography sx={{ fontSize: 12, color: '#2e7d32' }}>Average Nutrient</Typography>
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

        {/* Other Summary cards */}
        <CardsGrid>
          <Card>
            <Typography sx={{ fontSize: 12, color: '#2e7d32' }}>Soil pH</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1b5e20' }}>{summary.soilPH !== null ? summary.soilPH.toFixed(1) : '-'}</Typography>
            <Typography sx={{ fontSize: 12, color: '#66bb6a' }}>Acidity/alkalinity</Typography>
          </Card>
          <Card>
            <Typography sx={{ fontSize: 12, color: '#2e7d32' }}>Nitrogen (proxy)</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1b5e20' }}>{summary.nitrogen !== null ? `${summary.nitrogen} ppm` : '-'}</Typography>
            <Typography sx={{ fontSize: 12, color: '#66bb6a' }}>Using phosphorus as proxy</Typography>
          </Card>
          <Card>
            <Typography sx={{ fontSize: 12, color: '#2e7d32' }}>Water Usage</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1b5e20' }}>{summary.waterUsage !== null ? `${summary.waterUsage} gal/acre` : '-'}</Typography>
            <Typography sx={{ fontSize: 12, color: '#66bb6a' }}>Estimated from yield</Typography>
          </Card>
          <Card>
            <Typography sx={{ fontSize: 12, color: '#2e7d32' }}>Disease Incidence</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1b5e20' }}>{summary.diseaseIncidence !== null ? `${summary.diseaseIncidence}%` : '-'}</Typography>
            <Typography sx={{ fontSize: 12, color: '#66bb6a' }}>Based on health status</Typography>
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

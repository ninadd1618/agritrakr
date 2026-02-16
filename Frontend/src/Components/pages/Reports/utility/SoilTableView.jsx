import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { Box, Button, Switch, Typography } from "@mui/material";
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from "@coreui/react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const Header = styled(Box)`
  margin: 3% 0 1% 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Controls = styled(Box)`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const Section = styled(Box)`
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
`;

function formatDate(ts) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function SoilTableView({ dates }) {
  const [type, setType] = useState("macro");
  const [mode, setMode] = useState("count");
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState({ good: 0, warning: 0, critical: 0 });
  const [avgNutrient, setAvgNutrient] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {};
        if (dates && dates[0]) params.start = dates[0];
        if (dates && dates[1]) params.end = dates[1];
        params.type = type;
        params.mode = mode;
        const res = await axios.get("/api/v1/soil/table", { params });
        const data = res?.data?.data || {};
        setColumns(data.columns || []);
        setRows(data.rows || []);

        // Fetch raw soil data for status calculation
        const soilParams = {};
        if (dates && dates[0]) soilParams.start = dates[0];
        if (dates && dates[1]) soilParams.end = dates[1];
        soilParams.limit = 100;
        const soilRes = await axios.get("/api/v1/soil/data", { params: soilParams });
        const soilData = soilRes.data?.data || [];

        // Fetch ideal values
        const idealsRes = await axios.get("/api/v1/soil/ideals");
        const idealsData = idealsRes.data?.data || {};

        // Get latest raw data for status calculation
        if (soilData && soilData.length > 0) {
          const latest = soilData[soilData.length - 1];
          const nutrientKeys = type === 'macro' 
            ? ['phosphorus', 'potassium', 'calcium', 'magnesium', 'sulfur']
            : ['iron', 'manganese', 'zinc', 'copper', 'sodium'];

          console.log('SoilTableView - Raw data count:', soilData.length, 'Latest:', latest, 'Ideals:', idealsData);

          let good = 0, warning = 0, critical = 0;
          const nutrientPercentages = [];

          nutrientKeys.forEach(key => {
            const value = latest[key] || 0;
            const ideal = idealsData[key] || 0;
            console.log(`SoilTableView - ${key}: value=${value}, ideal=${ideal}`);
            if (ideal > 0 && value > 0) {
              const deviation = Math.abs(value - ideal);
              const percentage = Math.min((value / ideal) * 100, 100);
              nutrientPercentages.push(percentage);
              
              if (deviation >= ideal * 0.2) critical++;
              else if (deviation >= ideal * 0.1) warning++;
              else good++;
            }
          });

          console.log('SoilTableView - Status:', { good, warning, critical }, 'Percentages:', nutrientPercentages);

          setStatusCounts({ good, warning, critical });
          
          // Calculate average nutrient percentage
          if (nutrientPercentages.length > 0) {
            const avg = nutrientPercentages.reduce((sum, pct) => sum + pct, 0) / nutrientPercentages.length;
            setAvgNutrient(avg.toFixed(1));
          } else {
            setAvgNutrient(null);
          }
        } else {
          console.log('SoilTableView - No soil data available');
          setStatusCounts({ good: 0, warning: 0, critical: 0 });
          setAvgNutrient(null);
        }
      } catch (err) {
        console.error('Error fetching soil data:', err);
        setColumns([]);
        setRows([]);
        setStatusCounts({ good: 0, warning: 0, critical: 0 });
        setAvgNutrient(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dates, type, mode]);

  const visibleColumns = useMemo(() => columns, [columns]);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    
    // Summary Sheet
    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.addRow(['Metric', 'Value']);
    summarySheet.addRow(['Average Nutrient (%)', avgNutrient ?? '-']);
    summarySheet.addRow([]);  // Empty row
    summarySheet.addRow(['Status Overview', '']);
    summarySheet.addRow(['Good', statusCounts.good]);
    summarySheet.addRow(['Warning', statusCounts.warning]);
    summarySheet.addRow(['Critical', statusCounts.critical]);
    
    // Nutrient Data Sheet
    const worksheet = workbook.addWorksheet("Nutrient Table");
    const header = visibleColumns.map((c) => (c === "date" ? "Date" : c.charAt(0).toUpperCase() + c.slice(1)));
    worksheet.addRow(header).font = { bold: true };
    rows.forEach((r) => {
      const rowData = visibleColumns.map((c) => {
        if (c === "date") return r[c] ? formatDate(r[c]) : "-";
        const v = r[c];
        return v === null || v === undefined ? "-" : v;
      });
      worksheet.addRow(rowData);
    });
    worksheet.columns.forEach((col) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const v = cell.value ? String(cell.value) : "";
        maxLength = Math.max(maxLength, v.length + 2);
      });
      col.width = Math.min(maxLength, 40);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `nutrient-${type}-${mode}.xlsx`);
  };

  return (
    <Section>
      <Header>
        <Typography sx={{ color: "#0f2765", fontWeight: 700 }}>Nutrient Details</Typography>
        <Controls>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              className={type === "macro" ? "active" : ""}
              onClick={() => setType("macro")}
              sx={{ color: "#0f2765", fontWeight: 600 }}
            >
              MACRO-NUTRIENTS
            </Button>
            <Button
              className={type === "micro" ? "active" : ""}
              onClick={() => setType("micro")}
              sx={{ color: "#0f2765", fontWeight: 600 }}
            >
              MICRO-NUTRIENTS
            </Button>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ color: "#0f2765", fontSize: 13 }}>Count</Typography>
            <Switch
              checked={mode === "percentage"}
              onChange={(e) => setMode(e.target.checked ? "percentage" : "count")}
            />
            <Typography sx={{ color: "#0f2765", fontSize: 13 }}>Percentage</Typography>
          </Box>
          <Button onClick={handleExportExcel} sx={{ color: "#0f2765", fontWeight: 600 }}>Export Table</Button>
        </Controls>
      </Header>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, marginBottom: 2 }}>
        <Box sx={{ 
          background: '#fff', 
          padding: 2, 
          borderRadius: 2, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          <Typography sx={{ fontSize: 12, color: '#0f2765', marginBottom: 1 }}>Average Nutrient</Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#4caf50' }}>
            {avgNutrient !== null ? `${avgNutrient}%` : '-'}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#999' }}>All nutrients combined</Typography>
        </Box>
        
        <Box sx={{ 
          background: '#fff', 
          padding: 2, 
          borderRadius: 2, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          <Typography sx={{ fontSize: 12, color: '#0f2765', marginBottom: 1 }}>Status Overview</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-around' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#4caf50' }}>{statusCounts.good}</Typography>
              <Typography sx={{ fontSize: 10, color: '#66bb6a' }}>Good</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#ff9800' }}>{statusCounts.warning}</Typography>
              <Typography sx={{ fontSize: 10, color: '#ffb74d' }}>Warning</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#f44336' }}>{statusCounts.critical}</Typography>
              <Typography sx={{ fontSize: 10, color: '#e57373' }}>Critical</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box>
        <CTable bordered borderColor="lightgray" style={{ textAlign: "center" }}>
          <CTableHead>
            <CTableRow>
              {visibleColumns.map((c) => (
                <CTableHeaderCell key={c} style={{ whiteSpace: "nowrap" }}>
                  {c === "date" ? "Date" : c.charAt(0).toUpperCase() + c.slice(1)}
                </CTableHeaderCell>
              ))}
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {loading ? (
              <CTableRow>
                <CTableDataCell colSpan={visibleColumns.length}>Loading...</CTableDataCell>
              </CTableRow>
            ) : rows && rows.length > 0 ? (
              rows.map((r, idx) => (
                <CTableRow key={idx} color={idx % 2 === 0 ? "" : "light"}>
                  {visibleColumns.map((c) => (
                    <CTableDataCell key={c}>
                      {c === "date" 
                        ? (r[c] ? formatDate(r[c]) : "-") 
                        : (r[c] === null || r[c] === undefined 
                          ? "-" 
                          : mode === "percentage" ? `${r[c]}%` : r[c]
                        )
                      }
                    </CTableDataCell>
                  ))}
                </CTableRow>
              ))
            ) : (
              <CTableRow>
                <CTableDataCell colSpan={visibleColumns.length}>No Data</CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>
      </Box>
    </Section>
  );
}

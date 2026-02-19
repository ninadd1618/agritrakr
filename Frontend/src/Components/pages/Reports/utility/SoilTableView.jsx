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
        // ensure table rows are sorted latest-first by date/timestamp
        const rawRows = data.rows || [];
        const sortedRows = rawRows.slice().sort((a, b) => {
          const ta = a.date || a.timestamp || a.ts || 0;
          const tb = b.date || b.timestamp || b.ts || 0;
          return new Date(tb) - new Date(ta);
        });
        setRows(sortedRows);

        // Fetch raw soil data for status calculation - DO NOT filter by type to match Dashboard
        const soilParams = {};
        if (dates && dates[0]) soilParams.start = dates[0];
        if (dates && dates[1]) soilParams.end = dates[1];
        soilParams.limit = 100;
        // Note: NOT passing type parameter here - we need ALL nutrients for status calculation
        const soilRes = await axios.get("/api/v1/soil/data", { params: soilParams });
        const soilData = soilRes.data?.data || [];

        // Fetch ideal values
        const idealsRes = await axios.get("/api/v1/soil/ideals");
        const idealsData = idealsRes.data?.data || {};

        // Get latest raw data for status calculation - use sorted descending by timestamp
        if (soilData && soilData.length > 0) {
          const sortedSoil = soilData.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          const toNum = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
          const getLastValue = (key) => {
            for (let i = 0; i < sortedSoil.length; i++) {
              const v = sortedSoil[i][key];
              const n = toNum(v);
              if (n != null) return n;
            }
            return null;
          };

          // Define macro and micro nutrients
          const macroNutrients = ['phosphorus', 'potassium', 'calcium', 'magnesium', 'sulfur'];
          const microNutrients = ['iron', 'manganese', 'zinc', 'copper'];

          // Use ALL 10 nutrients for Average Nutrient calculation to match QualityController/Reports
          // This ensures consistency across Table View and Reports sections
          const allNutrientKeys = ['nitrogen', 'phosphorus', 'sulfur', 'zinc', 'iron', 'manganese', 'copper', 'potassium', 'calcium', 'magnesium'];
          
          // Use only displayed nutrients for status counts (per tab)
          const displayedNutrientKeys = type === 'macro' ? macroNutrients : microNutrients;

          // Normalize ideals - only use genuine database values, no fallbacks
          const normalizeIdeal = (field) => {
            const v = idealsData[field];
            if (typeof v === 'number') return v;
            if (v && typeof v === 'object' && v.min != null && v.max != null) return (Number(v.min) + Number(v.max)) / 2;
            return null;
          };

          // Pre-normalize all ideals - only genuine database values
          const idealsNormalized = {
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

          let good = 0, warning = 0, critical = 0;
          const nutrientPercentages = [];

          // Calculate Average Nutrient using ALL 10 nutrients (same as QualityController/Reports)
          allNutrientKeys.forEach(key => {
            const value = getLastValue(key);
            const ideal = idealsNormalized[key];
            if (value == null || ideal == null || ideal === 0) return;
            const percentage = (value / ideal) * 100;
            nutrientPercentages.push(Math.min(percentage, 100));
          });

          // Count status only for displayed nutrients (macro or micro tab)
          displayedNutrientKeys.forEach(key => {
            const value = getLastValue(key);
            const ideal = idealsNormalized[key];
            if (value == null || ideal == null || ideal === 0) return;
            const deviation = Math.abs(value - ideal);
            if (deviation >= ideal * 0.2) critical++;
            else if (deviation >= ideal * 0.1) warning++;
            else good++;
          });

          setStatusCounts({ good, warning, critical });

          if (nutrientPercentages.length > 0) {
            const avg = nutrientPercentages.reduce((sum, pct) => sum + pct, 0) / nutrientPercentages.length;
            setAvgNutrient((Math.round(avg * 10) / 10).toFixed(1));
          } else {
            setAvgNutrient(null);
          }
        } else {
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

  const visibleColumns = useMemo(() => columns.filter(c => c !== 'sodium'), [columns]);

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
          <Typography sx={{ fontSize: 11, color: '#999' }}>All 10 nutrients combined</Typography>
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

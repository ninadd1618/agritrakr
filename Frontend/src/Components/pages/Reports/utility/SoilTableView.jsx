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

const Card = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
`;

const CardsRow = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
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
        
        // Sort rows by date descending (latest first)
        const rawRows = data.rows || [];
        const sortedRows = rawRows.slice().sort((a, b) => {
          const ta = a.date || 0;
          const tb = b.date || 0;
          return new Date(tb) - new Date(ta);
        });
        setRows(sortedRows);

        // Fetch raw soil data for status calculation
        const soilParams = { limit: 100 };
        if (dates && dates[0]) soilParams.start = dates[0];
        if (dates && dates[1]) soilParams.end = dates[1];
        const soilRes = await axios.get("/api/v1/soil/data", { params: soilParams });
        const soilData = soilRes.data?.data || [];

        // Fetch ideal values
        const idealsRes = await axios.get("/api/v1/soil/ideals");
        const idealsData = idealsRes.data?.data || {};

        // Calculate status and average nutrient
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
          const nutrientKeys = type === 'macro' ? macroNutrients : microNutrients;

          const normalizeIdeal = (field) => {
            const v = idealsData[field];
            if (typeof v === 'number') return v;
            if (v && typeof v === 'object' && v.min != null && v.max != null) return (Number(v.min) + Number(v.max)) / 2;
            return null;
          };

          let good = 0, warning = 0, critical = 0;
          const nutrientPercentages = [];

          nutrientKeys.forEach(key => {
            const value = getLastValue(key);
            const ideal = normalizeIdeal(key);
            if (value == null || ideal == null || ideal === 0) return;
            const percentage = (value / ideal) * 100;
            nutrientPercentages.push(Math.min(percentage, 100));
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

  const visibleColumns = useMemo(() => columns, [columns]);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
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
              variant={type === "macro" ? "contained" : "text"}
              onClick={() => setType("macro")}
              sx={{ 
                color: type === "macro" ? "#fff" : "#0f2765", 
                fontWeight: 600,
                backgroundColor: type === "macro" ? "#0f2765" : "transparent",
                '&:hover': { backgroundColor: type === "macro" ? "#1a3a8a" : "rgba(15, 39, 101, 0.1)" }
              }}
            >
              MACRO-NUTRIENTS
            </Button>
            <Button
              variant={type === "micro" ? "contained" : "text"}
              onClick={() => setType("micro")}
              sx={{ 
                color: type === "micro" ? "#fff" : "#0f2765", 
                fontWeight: 600,
                backgroundColor: type === "micro" ? "#0f2765" : "transparent",
                '&:hover': { backgroundColor: type === "micro" ? "#1a3a8a" : "rgba(15, 39, 101, 0.1)" }
              }}
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
          <Button onClick={handleExportExcel} sx={{ color: "#0f2765", fontWeight: 600 }}>EXPORT TABLE</Button>
        </Controls>
      </Header>

      {/* Summary Cards */}
      <CardsRow>
        <Card>
          <Typography sx={{ fontSize: 12, color: '#2e7d32', marginBottom: 1 }}>Average Nutrient</Typography>
          <Typography sx={{ fontSize: 32, fontWeight: 700, color: '#1b5e20' }}>
            {avgNutrient !== null ? `${avgNutrient}%` : '-'}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#66bb6a' }}>All nutrients combined</Typography>
        </Card>
        <Card>
          <Typography sx={{ fontSize: 12, color: '#2e7d32', marginBottom: 1 }}>Status Overview</Typography>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'space-around' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 32, fontWeight: 700, color: '#4caf50' }}>{statusCounts.good}</Typography>
              <Typography sx={{ fontSize: 12, color: '#66bb6a' }}>Good</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 32, fontWeight: 700, color: '#ff9800' }}>{statusCounts.warning}</Typography>
              <Typography sx={{ fontSize: 12, color: '#ffb74d' }}>Warning</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 32, fontWeight: 700, color: '#f44336' }}>{statusCounts.critical}</Typography>
              <Typography sx={{ fontSize: 12, color: '#e57373' }}>Critical</Typography>
            </Box>
          </Box>
        </Card>
      </CardsRow>

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
                      {c === "date" ? (r[c] ? formatDate(r[c]) : "-") : (r[c] === null || r[c] === undefined ? "-" : (mode === "percentage" ? `${r[c]}%` : r[c]))}
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

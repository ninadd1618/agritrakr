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
      } catch (_) {
        setColumns([]);
        setRows([]);
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
                      {c === "date" ? (r[c] ? formatDate(r[c]) : "-") : (r[c] === null || r[c] === undefined ? "-" : r[c])}
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

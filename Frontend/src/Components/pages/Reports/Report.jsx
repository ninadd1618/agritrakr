import React, { useState, useRef, forwardRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Box,
  Menu,
  MenuItem,
  IconButton,
} from "@mui/material";
import Datepicker from "../../DateTimePicker/DatePicker";
import { Container } from "react-bootstrap";
import { useReactToPrint } from "react-to-print";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { SoilTableView } from "./utility";
import MoreVertIcon from "@mui/icons-material/MoreVert";

// Styled components for consistent layout
const TopBar = styled(Box)`
  background-color: hsl(0deg 0% 95.29%);
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
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
  min-width: 0;
  flex: 1;

  @media (max-width: 768px) {
    width: 100%;
    gap: 16px;
  }
`;

const RightControls = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
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

const GridContainer = styled.div`
  padding-top: 70px;  /* clear the global fixed header */
  display: block;
  min-height: 100vh;
  width: 100%;

  @media (max-width: 768px) {
    padding-top: 60px;
  }
`;

// Component to render report content based on selected report type
const ReportContent = forwardRef(
  ({ dates, TableR }, ref) => {
    // Helper function to format date
    const formatDate = (timestamp) => {
      const date = new Date(timestamp);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear());
      return `${day}/${month}/${year}`;
    };

    return (
      <div ref={ref} style={{ paddingTop: 0, width: "100%" }}>
        <SoilTableView dates={dates} />
      </div>
    );
  }
);

// Main Report component
const Report = ({ isOpen, toggle }) => {
  // State variables to manage report types and data
  const [TableR] = useState(true);
  const componentPDF = useRef();
  const tableRef = useRef();
  const dates = useSelector((state) => state.datePicker.dates);

  // State for dropdown menu
  const [anchorEl, setAnchorEl] = useState(null);

  // Hook to handle PDF generation
  const generatePDF = useReactToPrint({
    content: () => componentPDF.current,
    documentTitle: "Table Report",
    onAfterPrint: () => toast.success("PDF downloaded successfully"),
  });

  // Function to extract table data and download as CSV
  const downloadCSV = () => {
    const table = tableRef.current;
    const rows = table.querySelectorAll("tr");

    const csvData = [];
    rows.forEach((row) => {
      const cols = row.querySelectorAll("td, th");
      const rowData = [];
      cols.forEach((col) => {
        rowData.push(col.innerText);
      });
      csvData.push(rowData.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvData.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "report_data.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);

    toast.success("CSV downloaded successfully");
  };
  // Function to extract table data and download as Excel
  const downloadExcel = async () => {
    const table = tableRef.current;
    if (!table) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report Data");

    const rows = table.querySelectorAll("tr");
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll("th, td");
      const rowData = Array.from(cells).map((cell) => cell.innerText);
      if (rowIndex === 0) {
        worksheet.addRow(rowData).font = { bold: true };
      } else {
        worksheet.addRow(rowData);
      }
    });

    worksheet.columns.forEach((col) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const v = cell.value ? String(cell.value) : "";
        maxLength = Math.max(maxLength, v.length + 2);
      });
      col.width = Math.min(maxLength, 60);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "report_data.xlsx");

    toast.success("Data downloaded succesfully");
  };

  // Dropdown menu handlers
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Function to handle menu item click
  const handleMenuItemClick = (action) => {
    switch (action) {
      case "pdf":
        // Logic to handle PDF download
        generatePDF();
        break;
      case "excel":
        // Logic to handle Excel download
        downloadExcel();
        break;
      case "csv":
        // Logic to handle CSV download
        downloadCSV();
        break;
      default:
        toast.info("please try Again...");
        break;
    }

    // Close the menu after action
    handleClose();
  };

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

  return (
    <GridContainer>
      <ToastContainer />
      {/* Main content container */}
      <Container
        fluid
        style={{ marginTop: 16, paddingLeft: 24, paddingRight: 24, boxSizing: "border-box" }}
      >
        {/* Top Bar with Name and Date Section */}
        <TopBar>
          <NameAndDateSection>
            <NameSection>
              <div className="value">Table View</div>
            </NameSection>
            <DateSection>
              <div className="label">Date Range</div>
              <div className="date-range">{formatDateRange()}</div>
            </DateSection>
          </NameAndDateSection>
          <RightControls>
            <Box sx={{ color: "#2e7d32" }}>
              <Datepicker />
            </Box>
            <IconButton
              aria-label="more"
              id="more-vert-button"
              aria-controls={anchorEl ? "long-menu" : undefined}
              aria-expanded={anchorEl ? "true" : undefined}
              aria-haspopup="true"
              onClick={handleClick}
              sx={{ color: "hsl(215.84deg 100% 15.1%)" }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => handleMenuItemClick("pdf")}>
                Download as PDF
              </MenuItem>
              <MenuItem onClick={() => handleMenuItemClick("excel")}>
                Download as Excel
              </MenuItem>
              <MenuItem onClick={() => handleMenuItemClick("csv")}>
                Download as CSV
              </MenuItem>
            </Menu>
          </RightControls>
        </TopBar>

        {/* Render selected report content */}
        <Box ref={tableRef}>
          <ReportContent
            ref={componentPDF}
            dates={dates}
            TableR={TableR}
            // TotalR={TotalR}
            // ShiftR={ShiftR}
          />
        </Box>
      </Container>
    </GridContainer>
  );
};

export default Report;

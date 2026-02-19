/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  CTable,
  CTableBody,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
} from "@coreui/react";

const StyledTable = styled(CTable)`
  tbody tr:nth-child(3n + 1) {
    background-color: hsl(48.62deg, 82.95%, 61.37%);
  }
  tbody tr:nth-child(3n + 2) {
    background-color: red;
  }
  tbody tr:nth-child(3n + 3) {
    background-color: blue;
  }
`;

// (no longer using the downtime helper in the compact table)

const PlantReport = ({ dates }) => {
  // const userData = useSelector((state) => state.auth.userData); // not used in compact table
  const [reportData, setReportData] = useState(null);

  // Default date range: December 20-29, 2025 (matching seeded data)
  // Use useMemo so these defaults are computed once and do not change
  // on re-renders (which was causing page to reset to 1).
  const { startDefault, stopDefault } = useMemo(() => {
    const defaultStart = new Date('2025-12-20T00:00:00.000Z');
    const defaultEnd = new Date('2025-12-29T23:59:59.000Z');
    return {
      startDefault: defaultStart.toISOString(),
      stopDefault: defaultEnd.toISOString(),
    };
  }, []);
  const start = dates?.[0] || startDefault;
  const stop = dates?.[1] || stopDefault;

  useEffect(() => {
    let mounted = true;
    // Use local backend endpoint that returns cached plant rows (served by BackEnd/src/routes/reportRoutes.js)
    const URL = `/api/v1/reports/plant?start=${encodeURIComponent(start)}&stop=${encodeURIComponent(stop)}`;
    const fetchReportData = async () => {
      try {
        const response = await fetch(URL, { headers: { 'Content-Type': 'application/json' } });
        const json = await response.json();
        const responseData = json?.data || [];
        if (mounted) setReportData(Array.isArray(responseData) ? responseData : []);
      } catch (error) {
        console.error('PlantReport fetch error', error);
        if (mounted) setReportData([]);
      }
    };

    fetchReportData();
    return () => { mounted = false; };
  }, [start, stop]);

  // Function to convert timestamp to DD/MM/YY format
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return String(timestamp).split('T')[0];
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  // Search and pagination state for the compact table view
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const normalize = (s) => (s === null || s === undefined ? '' : String(s).toLowerCase());

  // Map incoming reportData rows into the compact table shape
  const mappedRows = (Array.isArray(reportData) ? reportData : []).map((r) => {
    // defensive mapping: try several possible field names
    const crop = r.crop || r.Crop || r.crop_name || r.cropType || r.cropTypeName || r.crop_type || r.name;
    const farmPlot = r.farmPlot || r.farm_plot || r.plot || r.farm || r.plotName || r.farm_plot_name;
    const growthStage = r.growthStage || r.stage || r.growth_stage || r.phase;
    const healthStatus = r.health || r.healthStatus || r.status || r.health_status || r.health_state;
    const estimatedYield = r.estimatedYield || r.estimated_yield || r.yield || r.estimatedYieldKg || r.estimated_yield_kg || r.estimated_yield_kg_per_ha || r.estimated_yield_kg_ha;
    const lastScan = r.lastScan || r.timestamp || r.scanDate || r.last_scan;
    return { crop, farmPlot, growthStage, healthStatus, estimatedYield, lastScan };
  });

  const filtered = mappedRows.filter((row) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return normalize(row.crop).includes(q) || normalize(row.farmPlot).includes(q) || normalize(row.growthStage).includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  // reset page when filter changes
  useEffect(() => { setPage(1); }, [query, start, stop]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>Daily Summary</p>
        </div>
        <div>
          <input
            placeholder="Search data..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e6e6e6' }}
          />
        </div>
      </div>

      <StyledTable bordered borderColor="gray" style={{ textAlign: "center" }}>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell scope="col" style={{ textAlign: 'left' }}>Crop</CTableHeaderCell>
            <CTableHeaderCell scope="col">Farm Plot</CTableHeaderCell>
            <CTableHeaderCell scope="col">Growth Stage</CTableHeaderCell>
            <CTableHeaderCell scope="col">Health Status</CTableHeaderCell>
            <CTableHeaderCell scope="col">Estimated Yield (kg/ha)</CTableHeaderCell>
            <CTableHeaderCell scope="col">Last Scan</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {pageRows.length > 0 ? (
            pageRows.map((data, index) => (
              <CTableRow key={index}>
                <CTableDataCell style={{ textAlign: 'left' }}>{data.crop || '-'}</CTableDataCell>
                <CTableDataCell>{data.farmPlot || '-'}</CTableDataCell>
                <CTableDataCell>{data.growthStage || '-'}</CTableDataCell>
                <CTableDataCell>
                  {data.healthStatus ? (
                    <span style={{ padding: '6px 10px', borderRadius: 16, background: /healthy/i.test(String(data.healthStatus)) ? '#c8e6c9' : '#ffcdd2', color: /healthy/i.test(String(data.healthStatus)) ? '#1b5e20' : '#c62828', fontWeight: 700 }}>{data.healthStatus}</span>
                  ) : (
                    <span style={{ color: '#666' }}>-</span>
                  )}
                </CTableDataCell>
                <CTableDataCell>{data.estimatedYield ? Number(data.estimatedYield).toLocaleString() : '-'}</CTableDataCell>
                <CTableDataCell>{formatDate(data.lastScan)}</CTableDataCell>
              </CTableRow>
            ))
          ) : (
            <CTableRow>
              <CTableDataCell colSpan="6">No Dates Selected/No Data in Selected Dates</CTableDataCell>
            </CTableRow>
          )}
        </CTableBody>
      </StyledTable>

      {/* Pagination controls (simple) */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 12 }}>
        <button 
          disabled={page <= 1} 
          onClick={() => setPage(p => Math.max(1, p - 1))} 
          style={{ 
            padding: '6px 10px', 
            borderRadius: 6, 
            border: '1px solid #c8e6c9', 
            background: page <= 1 ? '#f5f5f5' : '#e8f5e9', 
            color: page <= 1 ? '#999' : '#2e7d32', 
            fontWeight: 600,
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            opacity: page <= 1 ? 0.6 : 1
          }}
        >
          Previous
        </button>
        <div style={{ color: '#2e7d32', fontWeight: 600 }}>{page} / {totalPages}</div>
        <button 
          disabled={page >= totalPages} 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
          style={{ 
            padding: '6px 10px', 
            borderRadius: 6, 
            border: '1px solid #c8e6c9', 
            background: page >= totalPages ? '#f5f5f5' : '#e8f5e9', 
            color: page >= totalPages ? '#999' : '#2e7d32', 
            fontWeight: 600,
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            opacity: page >= totalPages ? 0.6 : 1
          }}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default PlantReport;

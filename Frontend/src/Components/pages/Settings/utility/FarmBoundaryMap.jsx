import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    CircularProgress,
    MenuItem,
    Select,
    Snackbar,
    Alert,
    Tooltip,
    Typography,
    useMediaQuery,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UndoIcon from '@mui/icons-material/Undo';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import MapIcon from '@mui/icons-material/Map';
import EditIcon from '@mui/icons-material/Edit';
import L from 'leaflet';

// ── Design tokens (Soilytix inspired) ─────────────────────────────────────────
const COLORS = {
    bg: '#0d1117',
    surface: '#161b22',
    border: '#1e2d1e',
    accent: '#a3e635',
    accentDim: 'rgba(163,230,53,0.15)',
    textPrimary: '#e6edf3',
    textMuted: '#7d8590',
};

// ── Soil variables available for color-coding ──────────────────────────────────
const VARIABLES = [
    { key: 'moisture',    label: 'Moisture',    unit: '%' },
    { key: 'pH',          label: 'pH',          unit: '' },
    { key: 'temperature', label: 'Temperature', unit: '°C' },
    { key: 'nitrogen',    label: 'Nitrogen',    unit: 'mg/kg' },
    { key: 'phosphorus',  label: 'Phosphorus',  unit: 'mg/kg' },
    { key: 'potassium',   label: 'Potassium',   unit: 'mg/kg' },
    { key: 'sulfur',      label: 'Sulfur',      unit: 'mg/kg' },
    { key: 'zinc',        label: 'Zinc',        unit: 'mg/kg' },
    { key: 'iron',        label: 'Iron',        unit: 'mg/kg' },
    { key: 'calcium',     label: 'Calcium',     unit: 'mg/kg' },
];

// ── Viridis-style color scale (purple→blue→teal→green→yellow) ─────────────────
const PALETTE = [
    '#440154', '#482878', '#3e4a89', '#31688e',
    '#26828e', '#1f9e89', '#35b779', '#6ece58',
    '#b5de2b', '#fde725',
];

function valueToColor(val, min, max) {
    if (max === min) return PALETTE[Math.floor(PALETTE.length / 2)];
    const t = Math.max(0, Math.min(1, (val - min) / (max - min)));
    const idx = Math.min(Math.floor(t * (PALETTE.length - 1)), PALETTE.length - 1);
    return PALETTE[idx];
}

// ── Tile layers ────────────────────────────────────────────────────────────────
const TILES = {
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Esri, Maxar, Earthstar Geographics',
        label: 'Satellite',
        maxNativeZoom: 18,
        maxZoom: 20,
    },
    street: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
        label: 'Street',
        maxNativeZoom: 19,
        maxZoom: 20,
    },
};

// ── Vertex icon for boundary drawing ──────────────────────────────────────────
function makeVertexIcon() {
    return L.divIcon({
        className: '',
        html: `<div style="
            width:12px;height:12px;
            background:${COLORS.accent};
            border:2px solid #fff;
            border-radius:50%;
            box-shadow:0 1px 6px rgba(0,0,0,.6);
            cursor:grab;
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
    });
}

// ── Soil dot icon ──────────────────────────────────────────────────────────────
function makeSoilIcon(color, size = 10) {
    return L.divIcon({
        className: '',
        html: `<div style="
            width:${size}px;height:${size}px;
            background:${color};
            border:1.5px solid rgba(255,255,255,0.7);
            border-radius:50%;
            box-shadow:0 1px 4px rgba(0,0,0,.5);
            transition:transform .15s;
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

// ── Main component ─────────────────────────────────────────────────────────────
function FarmBoundaryMap({ farm, onClose }) {
    const isMobile = useMediaQuery('(max-width:600px)');

    const mapDivRef   = useRef(null);
    const mapRef      = useRef(null);
    const tileRef     = useRef(null);
    const polygonRef  = useRef(null);
    const vertexRef   = useRef([]);
    const soilMarkersRef = useRef([]);

    const [tileMode, setTileMode]       = useState('satellite');
    const [variable, setVariable]       = useState('moisture');
    const [soilData, setSoilData]       = useState([]);
    const [points, setPoints]           = useState([]);
    const [savedPoints, setSavedPoints] = useState([]);
    const [isDrawing, setIsDrawing]     = useState(false);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [snackbar, setSnackbar]       = useState({ open: false, message: '', severity: 'success' });

    const showSnackbar = (msg, sev = 'success') => setSnackbar({ open: true, message: msg, severity: sev });

    // ── Init map ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!mapDivRef.current || mapRef.current) return;

        const map = L.map(mapDivRef.current, {
            center: [farm.latitude, farm.longitude],
            zoom: 15,
            zoomControl: true,
        });

        const tile = L.tileLayer(TILES.satellite.url, {
            attribution: TILES.satellite.attribution,
            maxNativeZoom: TILES.satellite.maxNativeZoom,
            maxZoom: TILES.satellite.maxZoom,
        }).addTo(map);

        tileRef.current = tile;
        mapRef.current = map;

        return () => { map.remove(); mapRef.current = null; };
    }, []); // eslint-disable-line

    // ── Toggle satellite / street ─────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !tileRef.current) return;
        tileRef.current.remove();
        tileRef.current = L.tileLayer(TILES[tileMode].url, {
            attribution: TILES[tileMode].attribution,
            maxNativeZoom: TILES[tileMode].maxNativeZoom,
            maxZoom: TILES[tileMode].maxZoom,
        }).addTo(map);
    }, [tileMode]);

    // ── Load boundary + soil data ─────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const [boundaryRes, soilRes] = await Promise.all([
                    axios.get(`/api/v1/settings/farms/${farm._id}/boundary`, { withCredentials: true }),
                    axios.get(`/api/v1/soil/farm/${farm._id}`, { withCredentials: false }).catch(() => ({ data: { data: [] } })),
                ]);
                const boundary = boundaryRes.data?.data?.boundary || [];
                if (boundary.length >= 3) { setPoints(boundary); setSavedPoints(boundary); }
                setSoilData(soilRes.data?.data || []);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [farm._id]);

    // ── Draw boundary polygon + vertex markers ────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (polygonRef.current) { polygonRef.current.remove(); polygonRef.current = null; }
        vertexRef.current.forEach(m => m.remove());
        vertexRef.current = [];

        if (points.length === 0) return;

        if (points.length >= 3) {
            polygonRef.current = L.polygon(points.map(p => [p.lat, p.lng]), {
                color: COLORS.accent,
                fillColor: COLORS.accent,
                fillOpacity: 0.12,
                weight: 2,
                dashArray: isDrawing ? '6,4' : null,
            }).addTo(map);
        } else if (points.length >= 2) {
            polygonRef.current = L.polyline(points.map(p => [p.lat, p.lng]), {
                color: COLORS.accent, weight: 2, dashArray: '6,4',
            }).addTo(map);
        }

        const icon = makeVertexIcon();
        points.forEach((pt, idx) => {
            const m = L.marker([pt.lat, pt.lng], { icon, draggable: isDrawing, title: `Vertex ${idx + 1}` }).addTo(map);
            m.on('dragend', e => {
                const { lat, lng } = e.target.getLatLng();
                setPoints(prev => { const n = [...prev]; n[idx] = { lat, lng }; return n; });
            });
            vertexRef.current.push(m);
        });
    }, [points, isDrawing]);

    // ── Draw soil data markers ────────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        soilMarkersRef.current.forEach(m => m.remove());
        soilMarkersRef.current = [];

        const readings = soilData.filter(d => d.latitude != null && d.longitude != null);
        if (readings.length === 0) return;

        const vals = readings.map(d => d[variable]).filter(v => v != null);
        const min = Math.min(...vals);
        const max = Math.max(...vals);

        readings.forEach(d => {
            const val = d[variable];
            if (val == null) return;

            const varMeta = VARIABLES.find(v => v.key === variable) || { label: variable, unit: '' };
            const color = valueToColor(val, min, max);
            const icon = makeSoilIcon(color);

            const tooltipHtml = `
                <div style="background:#161b22;border:1px solid #1e2d1e;border-radius:6px;padding:10px 14px;color:#e6edf3;font-family:monospace;font-size:12px;min-width:180px">
                    <div style="color:#a3e635;font-weight:700;margin-bottom:6px;font-size:13px">📍 ${d.deviceId || 'Sensor'}</div>
                    <div style="color:#7d8590;font-size:11px;margin-bottom:8px">${new Date(d.timestamp).toLocaleString()}</div>
                    ${VARIABLES.map(v => {
                        const vv = d[v.key];
                        return vv != null
                            ? `<div style="display:flex;justify-content:space-between;gap:16px;margin:2px 0">
                                 <span style="color:${v.key === variable ? COLORS.accent : '#7d8590'}">${v.label}</span>
                                 <span style="color:${v.key === variable ? '#fff' : '#c9d1d9'};font-weight:${v.key === variable ? '700' : '400'}">${Number(vv).toFixed(2)} ${v.unit}</span>
                               </div>`
                            : '';
                    }).join('')}
                </div>`;

            const marker = L.marker([d.latitude, d.longitude], { icon })
                .bindTooltip(tooltipHtml, {
                    permanent: false, sticky: true, opacity: 1,
                    className: 'soil-tooltip-override',
                })
                .addTo(map);

            soilMarkersRef.current.push(marker);
        });
    }, [soilData, variable]);

    // ── Click handler for drawing ─────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const fn = e => setPoints(prev => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
        if (isDrawing) { map.getContainer().style.cursor = 'crosshair'; map.on('click', fn); }
        else { map.getContainer().style.cursor = ''; map.off('click', fn); }
        return () => map.off('click', fn);
    }, [isDrawing]);

    useEffect(() => {
        vertexRef.current.forEach(m => isDrawing ? m.dragging?.enable() : m.dragging?.disable());
    }, [isDrawing]);

    // ── Save / actions ────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (points.length < 3) { showSnackbar('Place at least 3 points', 'warning'); return; }
        try {
            setSaving(true);
            await axios.put(`/api/v1/settings/farms/${farm._id}/boundary`, { boundary: points }, { withCredentials: true });
            setSavedPoints(points);
            setIsDrawing(false);
            showSnackbar('Boundary saved! 🗺️');
        } catch (err) {
            showSnackbar(err?.response?.data?.message || 'Failed to save boundary', 'error');
        } finally { setSaving(false); }
    };

    const handleUndo      = () => setPoints(p => p.slice(0, -1));
    const handleClear     = () => { setPoints([]); setIsDrawing(false); };
    const handleCancel    = () => { setPoints(savedPoints); setIsDrawing(false); };

    // ── Compute legend data ───────────────────────────────────────────────────
    const soilWithCoords  = soilData.filter(d => d.latitude != null && d.longitude != null);
    const vals            = soilWithCoords.map(d => d[variable]).filter(v => v != null);
    const legendMin       = vals.length ? Math.min(...vals) : 0;
    const legendMax       = vals.length ? Math.max(...vals) : 100;
    const varMeta         = VARIABLES.find(v => v.key === variable) || { label: variable, unit: '' };
    const hasSoilData     = soilWithCoords.length > 0;

    // ── Tooltip CSS injection ─────────────────────────────────────────────────
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'soil-tooltip-style';
        style.textContent = `.soil-tooltip-override { background:transparent!important; border:none!important; box-shadow:none!important; padding:0!important; } .soil-tooltip-override::before { display:none!important; }`;
        if (!document.getElementById('soil-tooltip-style')) document.head.appendChild(style);
    }, []);

    return (
        <Box sx={{ bgcolor: COLORS.bg, borderRadius: 2, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>

            {/* ── Top toolbar ── */}
            <Box sx={{
                px: { xs: 1.5, sm: 2 },
                py: 1.2,
                bgcolor: COLORS.surface,
                borderBottom: `1px solid ${COLORS.border}`,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: 1,
            }}>
                {/* Row 1 on mobile: farm name + close button */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography sx={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Farm</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: { xs: 14, sm: 16 }, color: COLORS.textPrimary }}>{farm.farmName}</Typography>
                    </Box>
                    <Button
                        size="small" variant="text"
                        onClick={onClose}
                        sx={{ color: COLORS.textMuted, fontSize: 12, ml: 1, display: { xs: 'inline-flex', sm: 'none' }, '&:hover': { color: COLORS.textPrimary } }}
                    >
                        ✕ Close
                    </Button>
                </Box>

                {/* Row 2 on mobile: variable selector + tile toggle + close (desktop) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: 12, color: COLORS.textMuted, display: { xs: 'none', sm: 'block' } }}>Variable:</Typography>
                    <Select
                        size="small"
                        value={variable}
                        onChange={e => setVariable(e.target.value)}
                        sx={{
                            bgcolor: COLORS.bg, color: COLORS.textPrimary, fontSize: 13,
                            border: `1px solid ${COLORS.border}`,
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            '& .MuiSvgIcon-root': { color: COLORS.textMuted },
                            flex: { xs: 1, sm: 'none' },
                            minWidth: { xs: 'unset', sm: 140 },
                        }}
                        MenuProps={{ PaperProps: { sx: { bgcolor: COLORS.surface, color: COLORS.textPrimary } } }}
                    >
                        {VARIABLES.map(v => (
                            <MenuItem key={v.key} value={v.key} sx={{ fontSize: 13, '&:hover': { bgcolor: COLORS.accentDim } }}>
                                {v.label}
                            </MenuItem>
                        ))}
                    </Select>

                    <Tooltip title={tileMode === 'satellite' ? 'Switch to Street map' : 'Switch to Satellite'}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setTileMode(m => m === 'satellite' ? 'street' : 'satellite')}
                            startIcon={tileMode === 'satellite' ? <MapIcon sx={{ fontSize: 14 }} /> : <SatelliteAltIcon sx={{ fontSize: 14 }} />}
                            sx={{
                                color: COLORS.textMuted, borderColor: COLORS.border, fontSize: 12,
                                '&:hover': { borderColor: COLORS.accent, color: COLORS.accent },
                            }}
                        >
                            {tileMode === 'satellite' ? 'Street' : 'Satellite'}
                        </Button>
                    </Tooltip>

                    {/* Close — desktop only (mobile close is in row 1) */}
                    <Button
                        size="small" variant="text"
                        onClick={onClose}
                        sx={{ color: COLORS.textMuted, fontSize: 12, display: { xs: 'none', sm: 'inline-flex' }, '&:hover': { color: COLORS.textPrimary } }}
                    >
                        ✕ Close
                    </Button>
                </Box>
            </Box>

            {/* ── Map area ── */}
            <Box sx={{ position: 'relative' }}>
                {loading && (
                    <Box sx={{
                        position: 'absolute', inset: 0, zIndex: 1000,
                        display: 'flex', flexDirection: 'column', gap: 1,
                        justifyContent: 'center', alignItems: 'center',
                        bgcolor: 'rgba(13,17,23,0.85)',
                    }}>
                        <CircularProgress size={32} sx={{ color: COLORS.accent }} />
                        <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}>Loading map data…</Typography>
                    </Box>
                )}

                {/* Draw mode banner */}
                {isDrawing && (
                    <Box sx={{
                        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                        zIndex: 800, bgcolor: 'rgba(13,17,23,0.9)', border: `1px solid ${COLORS.accent}`,
                        borderRadius: 20, px: 2, py: 0.5,
                        color: COLORS.accent, fontSize: { xs: 11, sm: 12 }, fontWeight: 600,
                        whiteSpace: { xs: 'normal', sm: 'nowrap' },
                        maxWidth: { xs: '85%', sm: 'none' },
                        textAlign: 'center',
                    }}>
                        🖊️ Click map to place boundary points · Drag to adjust
                    </Box>
                )}

                {/* Stats overlay */}
                {!loading && (
                    <Box sx={{
                        position: 'absolute', top: 10, right: 10, zIndex: 800,
                        bgcolor: 'rgba(22,27,34,0.9)', border: `1px solid ${COLORS.border}`,
                        borderRadius: 1.5, px: 1.5, py: 0.8,
                    }}>
                        <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>
                            {savedPoints.length >= 3 ? `✅ Boundary: ${savedPoints.length} pts` : '⬜ No boundary'}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>
                            📍 {soilWithCoords.length} readings
                        </Typography>
                    </Box>
                )}

                <div ref={mapDivRef} style={{ height: isMobile ? 300 : 480, width: '100%' }} />
            </Box>

            {/* ── Color legend ── */}
            {hasSoilData && (
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: COLORS.surface, borderTop: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: 11, color: COLORS.textMuted, mb: 0.5 }}>
                        {varMeta.label} {varMeta.unit && `(${varMeta.unit})`}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: 11, color: COLORS.textMuted, minWidth: 40 }}>
                            {legendMin.toFixed(1)}
                        </Typography>
                        <Box sx={{
                            flex: 1, height: 10, borderRadius: 1,
                            background: `linear-gradient(to right, ${PALETTE.join(',')})`,
                        }} />
                        <Typography sx={{ fontSize: 11, color: COLORS.textMuted, minWidth: 40, textAlign: 'right' }}>
                            {legendMax.toFixed(1)}
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mt: 0.5, opacity: 0.7 }}>
                        {vals.length} geo-tagged readings · Hover a dot for details
                    </Typography>
                </Box>
            )}

            {!hasSoilData && !loading && (
                <Box sx={{ px: 2.5, py: 1.2, bgcolor: COLORS.surface, borderTop: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>
                        💡 No geo-tagged soil readings yet. When posting sensor data, include <code style={{ color: COLORS.accent }}>farmId</code>, <code style={{ color: COLORS.accent }}>latitude</code>, and <code style={{ color: COLORS.accent }}>longitude</code> fields to see dots here.
                    </Typography>
                </Box>
            )}

            {/* ── Drawing toolbar ── */}
            <Box sx={{
                display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center',
                px: 2.5, py: 1.5, bgcolor: COLORS.bg, borderTop: `1px solid ${COLORS.border}`,
            }}>
                {!isDrawing ? (
                    <Button
                        variant="contained"
                        startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                        onClick={() => setIsDrawing(true)}
                        disabled={loading || saving}
                        sx={{
                            bgcolor: COLORS.accentDim, color: COLORS.accent,
                            border: `1px solid ${COLORS.accent}`, fontWeight: 700, fontSize: 13,
                            '&:hover': { bgcolor: 'rgba(163,230,53,0.25)' },
                        }}
                    >
                        {savedPoints.length >= 3 ? 'Edit Boundary' : 'Draw Boundary'}
                    </Button>
                ) : (
                    <>
                        <Button
                            size="small" variant="outlined" startIcon={<UndoIcon sx={{ fontSize: 14 }} />}
                            onClick={handleUndo} disabled={points.length === 0 || saving}
                            sx={{ color: COLORS.textMuted, borderColor: COLORS.border, fontSize: 12, '&:hover': { borderColor: COLORS.accent, color: COLORS.accent } }}
                        >
                            Undo
                        </Button>
                        <Button
                            size="small" variant="outlined" startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
                            onClick={handleClear} disabled={saving}
                            sx={{ color: '#f85149', borderColor: '#3d1e1e', fontSize: 12, '&:hover': { borderColor: '#f85149' } }}
                        >
                            Clear
                        </Button>
                        <Button
                            size="small" variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon sx={{ fontSize: 14 }} />}
                            onClick={handleSave} disabled={points.length < 3 || saving}
                            sx={{ bgcolor: COLORS.accent, color: '#0d1117', fontWeight: 700, fontSize: 13, '&:hover': { bgcolor: '#b5de2b' }, '&:disabled': { bgcolor: '#1e2d1e', color: '#555' } }}
                        >
                            {saving ? 'Saving…' : 'Save Boundary'}
                        </Button>
                        <Button
                            size="small" variant="text" onClick={handleCancel} disabled={saving}
                            sx={{ color: COLORS.textMuted, fontSize: 12 }}
                        >
                            Cancel
                        </Button>
                    </>
                )}
                {points.length > 0 && (
                    <Typography sx={{ fontSize: 12, color: COLORS.textMuted, ml: 1 }}>
                        {points.length} {points.length < 3 ? `/ 3 min` : 'vertices'}
                    </Typography>
                )}
            </Box>

            {/* ── Snackbar ── */}
            <Snackbar
                open={snackbar.open} autoHideDuration={3500}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default FarmBoundaryMap;

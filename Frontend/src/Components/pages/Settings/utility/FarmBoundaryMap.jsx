import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Snackbar,
    Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UndoIcon from '@mui/icons-material/Undo';

// Only vanilla Leaflet — no react-leaflet
import L from 'leaflet';

// Fix Leaflet default icon paths for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/** Creates a small green circle icon for polygon vertices */
function makeVertexIcon() {
    return L.divIcon({
        className: '',
        html: `<div style="
            width:14px;height:14px;
            background:#2e7d32;
            border:2px solid #fff;
            border-radius:50%;
            box-shadow:0 1px 4px rgba(0,0,0,.4);
            cursor:grab;
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
    });
}

function FarmBoundaryMap({ farm, onClose }) {
    const mapDivRef = useRef(null);   // DOM node for the map
    const mapRef = useRef(null);      // L.Map instance
    const polygonRef = useRef(null);  // L.Polygon on the map
    const markersRef = useRef([]);    // L.Marker[] for vertices

    const [points, setPoints] = useState([]);        // {lat, lng}[]
    const [savedPoints, setSavedPoints] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const showSnackbar = (msg, sev = 'success') => setSnackbar({ open: true, message: msg, severity: sev });

    // ── Initialize map once ─────────────────────────────────────────────────
    useEffect(() => {
        if (!mapDivRef.current || mapRef.current) return;

        const map = L.map(mapDivRef.current, {
            center: [farm.latitude, farm.longitude],
            zoom: 15,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Load existing boundary from backend ─────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(
                    `/api/v1/settings/farms/${farm._id}/boundary`,
                    { withCredentials: true }
                );
                const boundary = res.data?.data?.boundary || [];
                if (boundary.length >= 3) {
                    setPoints(boundary);
                    setSavedPoints(boundary);
                }
            } catch {
                // No boundary yet — user will draw fresh
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [farm._id]);

    // ── Draw / refresh polygon and markers on map whenever points change ────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Clear old polygon
        if (polygonRef.current) {
            polygonRef.current.remove();
            polygonRef.current = null;
        }

        // Clear old markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        if (points.length === 0) return;

        // Draw polygon (needs ≥ 3 points for a filled shape)
        if (points.length >= 3) {
            polygonRef.current = L.polygon(
                points.map((p) => [p.lat, p.lng]),
                { color: '#2e7d32', fillColor: '#66bb6a', fillOpacity: 0.25, weight: 2 }
            ).addTo(map);
        } else if (points.length >= 2) {
            // Draw a polyline preview while building
            polygonRef.current = L.polyline(
                points.map((p) => [p.lat, p.lng]),
                { color: '#2e7d32', weight: 2 }
            ).addTo(map);
        }

        // Draw vertex markers
        const icon = makeVertexIcon();
        points.forEach((pt, idx) => {
            const marker = L.marker([pt.lat, pt.lng], {
                icon,
                draggable: isDrawing,
                title: `Point ${idx + 1}`,
            }).addTo(map);

            marker.on('dragend', (e) => {
                const { lat, lng } = e.target.getLatLng();
                setPoints((prev) => {
                    const next = [...prev];
                    next[idx] = { lat, lng };
                    return next;
                });
            });

            markersRef.current.push(marker);
        });
    }, [points, isDrawing]);

    // ── Attach / detach click handler based on isDrawing ───────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleClick = (e) => {
            setPoints((prev) => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
        };

        if (isDrawing) {
            map.getContainer().style.cursor = 'crosshair';
            map.on('click', handleClick);
        } else {
            map.getContainer().style.cursor = '';
            map.off('click', handleClick);
        }

        return () => {
            map.off('click', handleClick);
        };
    }, [isDrawing]);

    // ── Update marker draggable state when isDrawing toggles ───────────────
    useEffect(() => {
        markersRef.current.forEach((m) => {
            if (isDrawing) m.dragging?.enable();
            else m.dragging?.disable();
        });
    }, [isDrawing]);

    // ── Actions ─────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (points.length < 3) {
            showSnackbar('Place at least 3 points to define a boundary', 'warning');
            return;
        }
        try {
            setSaving(true);
            await axios.put(
                `/api/v1/settings/farms/${farm._id}/boundary`,
                { boundary: points },
                { withCredentials: true }
            );
            setSavedPoints(points);
            setIsDrawing(false);
            showSnackbar('Boundary saved! 🗺️');
        } catch (err) {
            showSnackbar(err?.response?.data?.message || 'Failed to save boundary', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUndo = () => setPoints((prev) => prev.slice(0, -1));
    const handleClearAll = () => { setPoints([]); setIsDrawing(false); };
    const handleCancel = () => { setPoints(savedPoints); setIsDrawing(false); };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                        🗺️ Farm Boundary — {farm.farmName}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: '#666' }}>
                        Center: {farm.latitude}, {farm.longitude}
                    </Typography>
                </Box>
                <Button size="small" variant="text" color="inherit" onClick={onClose}>
                    ✕ Close
                </Button>
            </Box>

            {/* Instruction banner */}
            <Alert severity="info" sx={{ mb: 1.5, py: 0.5, fontSize: 13 }}>
                {isDrawing
                    ? '🖊️ Click on the map to add points. Drag a point to move it. Hit Save when done.'
                    : savedPoints.length >= 3
                        ? '✅ Boundary loaded. Click "Edit Boundary" to modify.'
                        : 'Click "Start Drawing" then tap map corners to define your farm boundary.'}
            </Alert>

            {/* Status chips */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                <Chip
                    size="small"
                    label={`${points.length} point${points.length !== 1 ? 's' : ''}`}
                    color={points.length >= 3 ? 'success' : 'default'}
                />
                {savedPoints.length >= 3 && (
                    <Chip size="small" label="Saved ✓" color="success" variant="outlined" />
                )}
            </Box>

            {/* Map container — always rendered so mapRef initialises */}
            <Box
                sx={{
                    height: 420,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid #ccc',
                    mb: 2,
                    position: 'relative',
                }}
            >
                {/* loading spinner overlay */}
                {loading && (
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        bgcolor: 'rgba(255,255,255,0.75)', zIndex: 1000,
                    }}>
                        <CircularProgress size={32} />
                    </Box>
                )}
                <div ref={mapDivRef} style={{ height: '100%', width: '100%' }} />
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                {!isDrawing ? (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setIsDrawing(true)}
                        disabled={loading || saving}
                    >
                        {savedPoints.length >= 3 ? '✏️ Edit Boundary' : '🖊️ Start Drawing'}
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="outlined"
                            startIcon={<UndoIcon />}
                            onClick={handleUndo}
                            disabled={points.length === 0 || saving}
                        >
                            Undo
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={handleClearAll}
                            disabled={saving}
                        >
                            Clear All
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            onClick={handleSave}
                            disabled={points.length < 3 || saving}
                        >
                            {saving ? 'Saving…' : 'Save Boundary'}
                        </Button>
                        <Button variant="text" onClick={handleCancel} disabled={saving}>
                            Cancel
                        </Button>
                    </>
                )}
            </Box>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3500}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default FarmBoundaryMap;

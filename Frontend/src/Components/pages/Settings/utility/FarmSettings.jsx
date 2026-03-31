import React, { lazy, Suspense, useEffect, useState } from 'react';
import axios from 'axios';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Grid,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import MapIcon from '@mui/icons-material/Map';

// Lazy-load the map so Leaflet errors can't crash the whole settings page
const FarmBoundaryMap = lazy(() => import('./FarmBoundaryMap'));

const defaultForm = { farmName: '', latitude: '', longitude: '' };


function FarmSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [farms, setFarms] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [mapFarm, setMapFarm] = useState(null); // Farm whose boundary map is open
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchFarms = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/v1/settings/farms', { withCredentials: true });
            setFarms(res.data?.data || []);
        } catch (err) {
            showSnackbar(err?.response?.data?.message || 'Failed to load farms', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFarms();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setFormData(defaultForm);
    };

    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.farmName.trim()) {
            showSnackbar('Farm name is required', 'error');
            return;
        }
        if (formData.latitude === '' || formData.longitude === '') {
            showSnackbar('Latitude and Longitude are required', 'error');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                farmName: formData.farmName.trim(),
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude),
            };

            if (editingId) {
                await axios.put(`/api/v1/settings/farms/${editingId}`, payload, { withCredentials: true });
                showSnackbar('Farm updated successfully');
                // Update mapFarm in case it's open
                if (mapFarm?._id === editingId) {
                    setMapFarm((prev) => ({ ...prev, ...payload }));
                }
            } else {
                await axios.post('/api/v1/settings/farms', payload, { withCredentials: true });
                showSnackbar('Farm added successfully');
            }
            resetForm();
            await fetchFarms();
        } catch (err) {
            showSnackbar(err?.response?.data?.message || 'Failed to save farm', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (farm) => {
        setFormData({
            farmName: farm.farmName || '',
            latitude: farm.latitude ?? '',
            longitude: farm.longitude ?? '',
        });
        setEditingId(farm._id);
    };

    const handleDelete = async (farmId) => {
        const confirmed = window.confirm('Are you sure you want to delete this farm?');
        if (!confirmed) return;

        try {
            setSaving(true);
            await axios.delete(`/api/v1/settings/farms/${farmId}`, { withCredentials: true });
            showSnackbar('Farm deleted successfully');
            if (editingId === farmId) resetForm();
            if (mapFarm?._id === farmId) setMapFarm(null);
            await fetchFarms();
        } catch (err) {
            showSnackbar(err?.response?.data?.message || 'Failed to delete farm', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleMap = (farm) => {
        setMapFarm((prev) => (prev?._id === farm._id ? null : farm));
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Section header */}
            <Box sx={{ borderBottom: '2px solid lightgray', pb: 2, mb: 3 }}>
                <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Farm Settings</Typography>
                <Typography sx={{ color: '#666', mt: 0.5 }}>
                    Manage your farms, geographic locations, and draw field boundaries.
                </Typography>
            </Box>

            {/* Farm count chip */}
            {!loading && (
                <Chip
                    icon={<AgricultureIcon />}
                    label={`${farms.length} farm${farms.length !== 1 ? 's' : ''} registered`}
                    color={farms.length > 0 ? 'success' : 'default'}
                    sx={{ mb: 2, fontWeight: 600 }}
                />
            )}

            {/* Add / Edit form */}
            <Paper elevation={1} sx={{ p: 2.5, mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 2 }}>
                    {editingId ? '✏️ Edit Farm' : '➕ Add Farm'}
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Farm Name"
                                value={formData.farmName}
                                onChange={(e) => handleChange('farmName', e.target.value)}
                                required
                                size="small"
                                placeholder="e.g. North Field"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Latitude"
                                type="number"
                                inputProps={{ step: 'any', min: -90, max: 90 }}
                                value={formData.latitude}
                                onChange={(e) => handleChange('latitude', e.target.value)}
                                required
                                size="small"
                                placeholder="e.g. 28.6139"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Longitude"
                                type="number"
                                inputProps={{ step: 'any', min: -180, max: 180 }}
                                value={formData.longitude}
                                onChange={(e) => handleChange('longitude', e.target.value)}
                                required
                                size="small"
                                placeholder="e.g. 77.2090"
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            startIcon={
                                saving
                                    ? <CircularProgress size={16} color="inherit" />
                                    : <AddLocationAltIcon />
                            }
                        >
                            {saving ? 'Saving…' : editingId ? 'Update Farm' : 'Add Farm'}
                        </Button>
                        {editingId && (
                            <Button type="button" variant="outlined" onClick={resetForm} disabled={saving}>
                                Cancel
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>

            {/* Farm list table */}
            <Paper elevation={1} sx={{ p: 2.5 }}>
                <Typography sx={{ fontWeight: 600, mb: 2 }}>Your Farms</Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : farms.length === 0 ? (
                    <Typography sx={{ color: '#888', py: 2 }}>
                        No farms added yet. Use the form above to add your first farm.
                    </Typography>
                ) : (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Farm Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Latitude</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Longitude</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Boundary</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {farms.map((farm) => (
                                        <React.Fragment key={farm._id}>
                                            <TableRow
                                                hover
                                                selected={editingId === farm._id}
                                                sx={{ '& td': { verticalAlign: 'middle' } }}
                                            >
                                                <TableCell sx={{ fontWeight: 600 }}>{farm.farmName}</TableCell>
                                                <TableCell>{farm.latitude}</TableCell>
                                                <TableCell>{farm.longitude}</TableCell>
                                                <TableCell>
                                                    {farm.boundary?.length >= 3 ? (
                                                        <Chip
                                                            size="small"
                                                            color="success"
                                                            label={`${farm.boundary.length} pts`}
                                                        />
                                                    ) : (
                                                        <Chip size="small" label="Not set" color="default" />
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                        <Tooltip title="Draw / Edit map boundary">
                                                            <Button
                                                                size="small"
                                                                variant={mapFarm?._id === farm._id ? 'contained' : 'outlined'}
                                                                color="success"
                                                                startIcon={<MapIcon />}
                                                                onClick={() => handleToggleMap(farm)}
                                                                disabled={saving}
                                                            >
                                                                {mapFarm?._id === farm._id ? 'Close' : 'Boundary'}
                                                            </Button>
                                                        </Tooltip>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleEdit(farm)}
                                                            disabled={saving}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDelete(farm._id)}
                                                            disabled={saving}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>

                                            {/* Boundary map — inline below this farm's row */}
                                            <TableRow>
                                                <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                                                    <Collapse in={mapFarm?._id === farm._id} timeout="auto" unmountOnExit>
                                                        <Box sx={{ p: 2.5, bgcolor: '#f9fbe7', borderBottom: '1px solid #e0e0e0' }}>
                                                            <Suspense fallback={
                                                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                                                    <CircularProgress size={28} />
                                                                </Box>
                                                            }>
                                                                <FarmBoundaryMap
                                                                    farm={farm}
                                                                    onClose={() => setMapFarm(null)}
                                                                />
                                                            </Suspense>
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </Paper>

            {/* Snackbar feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3500}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default FarmSettings;

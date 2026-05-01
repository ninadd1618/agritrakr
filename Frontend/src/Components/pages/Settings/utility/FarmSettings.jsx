import React, { lazy, Suspense, useEffect, useState } from 'react';
import apiClient from '@config/api';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Collapse,
    Grid,
    Paper,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import MapIcon from '@mui/icons-material/Map';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

// Lazy-load the map so Leaflet errors can't crash the whole settings page
const FarmBoundaryMap = lazy(() => import('./FarmBoundaryMap'));

const defaultForm = { farmName: '', latitude: '', longitude: '' };


function FarmSettings() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [farms, setFarms] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [mapFarm, setMapFarm] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchFarms = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/api/v1/settings/farms');
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
                await apiClient.put(`/api/v1/settings/farms/${editingId}`, payload);
                showSnackbar('Farm updated successfully');
                if (mapFarm?._id === editingId) {
                    setMapFarm((prev) => ({ ...prev, ...payload }));
                }
            } else {
                await apiClient.post('/api/v1/settings/farms', payload);
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (farmId) => {
        const confirmed = window.confirm('Are you sure you want to delete this farm?');
        if (!confirmed) return;

        try {
            setSaving(true);
            await apiClient.delete(`/api/v1/settings/farms/${farmId}`);
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

    // ── Shared map panel (used in both mobile and desktop views) ─────────────
    const MapPanel = ({ farm }) => (
        <Collapse in={mapFarm?._id === farm._id} timeout="auto" unmountOnExit>
            <Box sx={{ p: { xs: 1, sm: 2.5 }, bgcolor: '#f9fbe7', borderTop: '1px solid #e0e0e0' }}>
                <Suspense fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                }>
                    <FarmBoundaryMap farm={farm} onClose={() => setMapFarm(null)} />
                </Suspense>
            </Box>
        </Collapse>
    );

    // ── Mobile: card list ─────────────────────────────────────────────────────
    const MobileList = () => (
        <Stack spacing={2}>
            {farms.map((farm) => (
                <Card
                    key={farm._id}
                    variant="outlined"
                    sx={{ borderColor: editingId === farm._id ? 'primary.main' : 'divider' }}
                >
                    <CardContent sx={{ pb: '8px !important' }}>
                        {/* Farm name + boundary chip */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{farm.farmName}</Typography>
                            {farm.boundary?.length >= 3
                                ? <Chip size="small" color="success" label={`${farm.boundary.length} pts`} />
                                : <Chip size="small" label="No boundary" color="default" />
                            }
                        </Box>

                        {/* Coordinates */}
                        <Typography sx={{ fontSize: 13, color: '#666' }}>
                            📍 {farm.latitude}, {farm.longitude}
                        </Typography>

                        {/* Action buttons */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                            <Button
                                size="small"
                                variant={mapFarm?._id === farm._id ? 'contained' : 'outlined'}
                                color="success"
                                startIcon={<MapIcon />}
                                onClick={() => handleToggleMap(farm)}
                                disabled={saving}
                                sx={{ flex: 1, minWidth: 100 }}
                            >
                                {mapFarm?._id === farm._id ? 'Close' : 'Boundary'}
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => handleEdit(farm)}
                                disabled={saving}
                                sx={{ flex: 1 }}
                            >
                                Edit
                            </Button>
                            <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={() => handleDelete(farm._id)}
                                disabled={saving}
                                sx={{ flex: 1 }}
                            >
                                Delete
                            </Button>
                        </Box>
                    </CardContent>

                    {/* Map panel inline below card */}
                    <MapPanel farm={farm} />
                </Card>
            ))}
        </Stack>
    );

    // ── Desktop: table ────────────────────────────────────────────────────────
    const DesktopTable = () => (
        <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 560 }}>
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
                                        <Chip size="small" color="success" label={`${farm.boundary.length} pts`} />
                                    ) : (
                                        <Chip size="small" label="Not set" color="default" />
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
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
                                    <MapPanel farm={farm} />
                                </TableCell>
                            </TableRow>
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box sx={{ width: '100%' }}>
            {/* Section header */}
            <Box sx={{ borderBottom: '2px solid lightgray', pb: 2, mb: 3 }}>
                <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 600 }}>Farm Settings</Typography>
                <Typography sx={{ color: '#666', mt: 0.5, fontSize: { xs: 13, sm: 14 } }}>
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
            <Paper elevation={1} sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 3 }}>
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
                        <Grid item xs={6} sm={6} md={4}>
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
                        <Grid item xs={6} sm={6} md={4}>
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
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            size={isMobile ? 'medium' : 'medium'}
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

            {/* Farm list */}
            <Paper elevation={1} sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <Typography sx={{ fontWeight: 600, mb: 2 }}>Your Farms</Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : farms.length === 0 ? (
                    <Typography sx={{ color: '#888', py: 2 }}>
                        No farms added yet. Use the form above to add your first farm.
                    </Typography>
                ) : isMobile ? (
                    <MobileList />
                ) : (
                    <DesktopTable />
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

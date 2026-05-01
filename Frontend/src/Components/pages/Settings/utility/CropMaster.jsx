import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '@config/api';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';

const IDEAL_FIELDS = [
    { key: 'moisture', label: 'Moisture', step: '0.1' },
    { key: 'pH', label: 'pH', step: '0.1' },
    { key: 'temperature', label: 'Temperature', step: '0.1' },
    { key: 'nitrogen', label: 'Nitrogen', step: '0.1' },
    { key: 'phosphorus', label: 'Phosphorus', step: '0.1' },
    { key: 'potassium', label: 'Potassium', step: '0.1' },
    { key: 'sulfur', label: 'Sulfur', step: '0.1' },
    { key: 'zinc', label: 'Zinc', step: '0.1' },
    { key: 'iron', label: 'Iron', step: '0.1' },
    { key: 'manganese', label: 'Manganese', step: '0.1' },
    { key: 'copper', label: 'Copper', step: '0.1' },
    { key: 'calcium', label: 'Calcium', step: '0.1' },
    { key: 'magnesium', label: 'Magnesium', step: '0.1' },
    { key: 'sodium', label: 'Sodium', step: '0.1' },
];

const defaultForm = IDEAL_FIELDS.reduce((acc, field) => {
    acc[field.key] = '';
    return acc;
}, { name: '' });

const toPayload = (formData) => {
    const payload = { name: formData.name.trim() };
    IDEAL_FIELDS.forEach((field) => {
        const value = formData[field.key];
        if (value !== '' && value != null) {
            payload[field.key] = Number(value);
        }
    });
    return payload;
};

function CropMaster() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [crops, setCrops] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [error, setError] = useState('');

    const activeCrop = useMemo(() => crops.find((crop) => crop.isActive), [crops]);

    const fetchCrops = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/v1/soil/crops', { withCredentials: true });
            setCrops(res.data?.data || []);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load crop list');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCrops();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setFormData(defaultForm);
    };

    const handleInputChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!formData.name.trim()) {
            setError('Crop name is required');
            return;
        }

        try {
            setSaving(true);
            setError('');
            const payload = toPayload(formData);
            if (editingId) {
                await axios.put(`/api/v1/soil/crops/${editingId}`, payload, { withCredentials: true });
            } else {
                await axios.post('/api/v1/soil/crops', payload, { withCredentials: true });
            }
            resetForm();
            await fetchCrops();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to save crop');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (crop) => {
        const nextForm = { ...defaultForm, name: crop.name || '' };
        IDEAL_FIELDS.forEach((field) => {
            nextForm[field.key] = crop[field.key] ?? '';
        });
        setFormData(nextForm);
        setEditingId(crop._id);
        setError('');
    };

    const handleDelete = async (cropId) => {
        const confirmed = window.confirm('Delete this crop and its ideal values?');
        if (!confirmed) return;

        try {
            setSaving(true);
            setError('');
            await axios.delete(`/api/v1/soil/crops/${cropId}`, { withCredentials: true });
            if (editingId === cropId) resetForm();
            await fetchCrops();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to delete crop');
        } finally {
            setSaving(false);
        }
    };

    const setAsActive = async (crop) => {
        if (crop.isActive) return;
        try {
            setSaving(true);
            setError('');
            await axios.put(`/api/v1/soil/crops/${crop._id}`, { isActive: true }, { withCredentials: true });
            await fetchCrops();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to set active crop');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography sx={{ fontSize: 22, fontWeight: 600, mb: 1 }}>Crop Master</Typography>
            <Typography sx={{ color: '#666', mb: 2 }}>
                Add crop-wise ideal values and choose the active crop used by soil dashboards.
            </Typography>

            {activeCrop && (
                <Chip
                    label={`Active Crop: ${activeCrop.name}`}
                    color="success"
                    sx={{ mb: 2, fontWeight: 600 }}
                />
            )}

            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 2 }}>{editingId ? 'Edit Crop' : 'Add Crop'}</Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Crop Name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                required
                            />
                        </Grid>
                        {IDEAL_FIELDS.map((field) => (
                            <Grid key={field.key} item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label={field.label}
                                    inputProps={{ step: field.step }}
                                    value={formData[field.key]}
                                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                                />
                            </Grid>
                        ))}
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {editingId ? 'Update Crop' : 'Add Crop'}
                        </Button>
                        <Button type="button" variant="outlined" onClick={resetForm} disabled={saving}>
                            Clear
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {error && (
                <Typography sx={{ color: '#d32f2f', mb: 2 }}>{error}</Typography>
            )}

            <Paper elevation={1} sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 600, mb: 2 }}>Added Crops</Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : crops.length === 0 ? (
                    <Typography sx={{ color: '#666' }}>No crops added yet.</Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Crop</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Moisture</TableCell>
                                    <TableCell>pH</TableCell>
                                    <TableCell>Temperature</TableCell>
                                    <TableCell>Nitrogen</TableCell>
                                    <TableCell>Phosphorus</TableCell>
                                    <TableCell>Potassium</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {crops.map((crop) => (
                                    <TableRow key={crop._id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{crop.name}</TableCell>
                                        <TableCell>
                                            {crop.isActive ? <Chip size="small" color="success" label="Active" /> : 'Inactive'}
                                        </TableCell>
                                        <TableCell>{crop.moisture ?? '-'}</TableCell>
                                        <TableCell>{crop.pH ?? '-'}</TableCell>
                                        <TableCell>{crop.temperature ?? '-'}</TableCell>
                                        <TableCell>{crop.nitrogen ?? '-'}</TableCell>
                                        <TableCell>{crop.phosphorus ?? '-'}</TableCell>
                                        <TableCell>{crop.potassium ?? '-'}</TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                <Button size="small" onClick={() => setAsActive(crop)} disabled={saving || crop.isActive}>
                                                    Set Active
                                                </Button>
                                                <Button size="small" variant="outlined" onClick={() => handleEdit(crop)} disabled={saving}>
                                                    Edit
                                                </Button>
                                                <Button size="small" color="error" onClick={() => handleDelete(crop._id)} disabled={saving}>
                                                    Delete
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
}

export default CropMaster;

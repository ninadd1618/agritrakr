import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Grid,
    Paper,
    Snackbar,
    TextField,
    Typography,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

function UserProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({ fullName: '', farmName: '', phone: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/v1/settings/profile', { withCredentials: true });
            const { fullName = '', farmName = '', phone = '', username = '', email = '' } = res.data?.data || {};
            setProfile({ fullName, farmName, phone, username, email });
        } catch (err) {
            showSnackbar(err?.response?.data?.message || 'Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleChange = (key, value) => {
        setProfile((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!profile.fullName.trim()) {
            showSnackbar('Full name is required', 'error');
            return;
        }
        try {
            setSaving(true);
            await axios.patch(
                '/api/v1/settings/profile',
                { fullName: profile.fullName, farmName: profile.farmName, phone: profile.phone },
                { withCredentials: true }
            );
            showSnackbar('Profile updated successfully');
        } catch (err) {
            showSnackbar(err?.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            {/* Section header */}
            <Box sx={{ borderBottom: '2px solid lightgray', pb: 2, mb: 3 }}>
                <Typography sx={{ fontSize: 22, fontWeight: 600 }}>User Profile</Typography>
                <Typography sx={{ color: '#666', mt: 0.5 }}>
                    Update your personal details and farm information.
                </Typography>
            </Box>

            {/* Read-only account info */}
            <Paper elevation={1} sx={{ p: 2.5, mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 2 }}>Account Information</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5, color: '#555' }}>
                            Username
                        </Typography>
                        <Typography
                            sx={{
                                border: '2px solid lightgray',
                                borderRadius: '6px',
                                px: 1.5,
                                py: 0.75,
                                color: '#888',
                                bgcolor: '#fafafa',
                            }}
                        >
                            {profile.username || '—'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5, color: '#555' }}>
                            Email
                        </Typography>
                        <Typography
                            sx={{
                                border: '2px solid lightgray',
                                borderRadius: '6px',
                                px: 1.5,
                                py: 0.75,
                                color: '#888',
                                bgcolor: '#fafafa',
                            }}
                        >
                            {profile.email || '—'}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Editable profile form */}
            <Paper elevation={1} sx={{ p: 2.5 }}>
                <Typography sx={{ fontWeight: 600, mb: 2 }}>Edit Profile</Typography>
                <Box component="form" onSubmit={handleSave}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={profile.fullName}
                                onChange={(e) => handleChange('fullName', e.target.value)}
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Farm Name"
                                value={profile.farmName}
                                onChange={(e) => handleChange('farmName', e.target.value)}
                                size="small"
                                placeholder="e.g. Green Valley Farm"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Phone (optional)"
                                value={profile.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                size="small"
                                placeholder="+91 98765 43210"
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 2.5 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <PersonOutlineIcon />}
                        >
                            {saving ? 'Saving…' : 'Save Profile'}
                        </Button>
                    </Box>
                </Box>
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

export default UserProfile;

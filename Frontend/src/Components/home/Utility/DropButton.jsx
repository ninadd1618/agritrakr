import { Box, IconButton } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PersonSharpIcon from '@mui/icons-material/PersonSharp';
import { MdOutlineLogout } from 'react-icons/md';

const DropButton = ({ username, show, onLogout }) => {
    const navigate = useNavigate();

    const handleLogoutClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Logout button clicked in dropdown');
        
        try {
            if (onLogout && typeof onLogout === 'function') {
                console.log('Calling onLogout function from dropdown');
                await onLogout();
            } else {
                console.log('No onLogout function, using fallback');
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
                navigate('/');
            }
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/');
        }
    };

    return (
        <div
            style={{
                background: '#ffff',
                float: 'right',
                color: 'black',
                borderRadius: '5px',
                display: 'inline-block',
                position: 'relative',
                zIndex: 1000,
            }}
        >
            {show &&
                <Box
                    sx={{
                        fontSize: '18px',
                        alignItems: 'center',
                        fontFamily: 'Georgia, serif',
                        color: 'black',
                        padding: ' 8px !important'
                    }}
                >
                    <p style={{ marginBottom: '2%', display: 'flex', alignItems: 'center' }}>
                        <IconButton><PersonSharpIcon sx={{ fontSize: 18, color: '#001f4d' }} /></IconButton>&nbsp;{username}
                    </p>
                    <p style={{ display: 'flex', margin: 'unset', alignItems: 'center' }}>
                        <IconButton 
                            onClick={handleLogoutClick}
                            sx={{ cursor: 'pointer' }}
                            title="Logout"
                        >
                            <MdOutlineLogout style={{ fontSize: 18, color: '#001f4d' }} />
                        </IconButton>
                        <span  
                            onClick={handleLogoutClick}
                            style={{ cursor: 'pointer', marginLeft: '8px' }}
                        >
                            logout
                        </span>
                    </p>
                </Box>
            }
        </div>
    );
};

export default DropButton;

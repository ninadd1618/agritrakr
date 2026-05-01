// Utility script to help update API imports
// This is a guide for manual updates

/*
HOW TO UPDATE YOUR COMPONENTS TO USE CENTRALIZED API:

1. Replace axios import:
   OLD: import axios from 'axios';
   NEW: import apiClient from '../config/api';

2. Replace axios calls:
   OLD: axios.post('/api/v1/auth/login', data, { withCredentials: true })
   NEW: apiClient.post('/api/v1/auth/login', data)

   OLD: axios.get('/api/v1/users', { withCredentials: true })
   NEW: apiClient.get('/api/v1/users')

   OLD: axios.patch('/api/v1/devices/123', data, { withCredentials: true })
   NEW: apiClient.patch('/api/v1/devices/123', data)

3. Benefits of using apiClient:
   - Automatic baseURL handling
   - Built-in withCredentials
   - Request/response interceptors
   - Error handling
   - Development logging

FILES THAT NEED UPDATING (based on search results):
- src/Components/pages/Configuration/utility/QualityController.jsx
- src/Components/pages/Settings/utility/CropMaster.jsx
- src/Components/pages/Settings/DeviceSettings.jsx
- src/Components/pages/Settings/utility/FarmSettings.jsx
- src/Components/pages/Reports/utility/SoilTableView.jsx
- src/Components/pages/Settings/utility/FarmBoundaryMap.jsx
- src/Components/pages/DashBoard/Dashboard.jsx
- src/Components/pages/MiniDashboard/MiniDashboard.jsx
- src/Components/pages/Settings/utility/UserProfile.jsx
- src/Components/pages/SoilDashboard/SoilDashboard.jsx
- src/Components/Navbar/SideBar.jsx
- src/Components/home/Home.jsx
- src/Components/pages/login-reg/Register.jsx
- And many more...

EXAMPLE UPDATE PATTERN:

// BEFORE:
import axios from 'axios';

const handleSubmit = async () => {
  try {
    const response = await axios.post('/api/v1/devices', deviceData, {
      withCredentials: true
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

// AFTER:
import apiClient from '../config/api';

const handleSubmit = async () => {
  try {
    const response = await apiClient.post('/api/v1/devices', deviceData);
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};
*/

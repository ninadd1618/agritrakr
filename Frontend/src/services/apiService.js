/**
 * Centralized API Service for AgriTrackr
 * 
 * This service provides a consistent interface for all API calls
 * and handles authentication, error handling, and environment configuration.
 */

import apiClient from '@config/api';

// Auth API
export const authAPI = {
  login: (credentials) => apiClient.post('/api/v1/auth/login', credentials),
  register: (userData) => apiClient.post('/api/v1/auth/register', userData),
  logout: () => apiClient.post('/api/v1/auth/logout'),
  refreshToken: () => apiClient.post('/api/v1/auth/refresh-token'),
  changePassword: (passwordData) => apiClient.post('/api/v1/auth/change-password', passwordData),
  getCurrentUser: () => apiClient.get('/api/v1/auth/current-user'),
  updateAccount: (userData) => apiClient.patch('/api/v1/auth/update-account', userData),
};

// User Settings API
export const settingsAPI = {
  getProfile: () => apiClient.get('/api/v1/settings/profile'),
  updateProfile: (profileData) => apiClient.patch('/api/v1/settings/profile', profileData),
  getFarms: () => apiClient.get('/api/v1/settings/farms'),
  createFarm: (farmData) => apiClient.post('/api/v1/settings/farms', farmData),
  updateFarm: (farmId, farmData) => apiClient.put(`/api/v1/settings/farms/${farmId}`, farmData),
  deleteFarm: (farmId) => apiClient.delete(`/api/v1/settings/farms/${farmId}`),
  getFarmBoundary: (farmId) => apiClient.get(`/api/v1/settings/farms/${farmId}/boundary`),
  updateFarmBoundary: (farmId, boundaryData) => apiClient.put(`/api/v1/settings/farms/${farmId}/boundary`, boundaryData),
  getMembers: () => apiClient.get('/api/v1/settings/members'),
};

// Device Management API
export const deviceAPI = {
  getDevices: () => apiClient.get('/api/v1/devices'),
  createDevice: (deviceData) => apiClient.post('/api/v1/devices', deviceData),
  updateDevice: (deviceId, deviceData) => apiClient.patch(`/api/v1/devices/${deviceId}`, deviceData),
  deleteDevice: (deviceId) => apiClient.delete(`/api/v1/devices/${deviceId}`),
  getDevice: (deviceId) => apiClient.get(`/api/v1/devices/${deviceId}`),
  updateDeviceStatus: (deviceId, statusData) => apiClient.patch(`/api/v1/devices/${deviceId}/status`, statusData),
};

// Soil Data API
export const soilAPI = {
  getSoilData: (params) => apiClient.get('/api/v1/soil/data', { params }),
  getSoilIdeals: () => apiClient.get('/api/v1/soil/ideals'),
  getSoilTable: (params) => apiClient.get('/api/v1/soil/table', { params }),
  getFarmSoilData: (farmId) => apiClient.get(`/api/v1/soil/farm/${farmId}`),
  getCrops: () => apiClient.get('/api/v1/soil/crops'),
  createCrop: (cropData) => apiClient.post('/api/v1/soil/crops', cropData),
  updateCrop: (cropId, cropData) => apiClient.put(`/api/v1/soil/crops/${cropId}`, cropData),
  deleteCrop: (cropId) => apiClient.delete(`/api/v1/soil/crops/${cropId}`),
  setActiveCrop: (cropId) => apiClient.put(`/api/v1/soil/crops/${cropId}`, { isActive: true }),
};

// Reports API
export const reportsAPI = {
  getPlantReport: (params) => apiClient.get('/api/v1/reports/plant', { params }),
  getSoilReport: (params) => apiClient.get('/api/v1/reports/soil', { params }),
  getFarmReport: (farmId, params) => apiClient.get(`/api/v1/reports/farm/${farmId}`, { params }),
};

// OEE/PLC API
export const oeeAPI = {
  getOEEData: (params) => apiClient.get('/api/v1/oee/data', { params }),
  getMachineAvailability: (params) => apiClient.get('/api/v1/oee/availability', { params }),
  getPerformance: (params) => apiClient.get('/api/v1/oee/performance', { params }),
  getProductionQuality: (params) => apiClient.get('/api/v1/oee/quality', { params }),
  getTotalProduction: (params) => apiClient.get('/api/v1/oee/production', { params }),
};

// Data Upload API
export const dataAPI = {
  uploadSoilData: (formData) => apiClient.post('/api/v1/data/soil', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadFinalData: (formData) => apiClient.post('/api/v1/data/final', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDataStats: () => apiClient.get('/api/v1/data/stats'),
};

// Export all APIs for easy importing
export default {
  auth: authAPI,
  settings: settingsAPI,
  device: deviceAPI,
  soil: soilAPI,
  reports: reportsAPI,
  oee: oeeAPI,
  data: dataAPI,
};

/**
 * Usage Examples:
 * 
 * import { authAPI, deviceAPI } from '../services/apiService';
 * 
 * // Login
 * const result = await authAPI.login({ email, password });
 * 
 * // Get devices
 * const devices = await deviceAPI.getDevices();
 * 
 * // Create device
 * const newDevice = await deviceAPI.createDevice(deviceData);
 * 
 * // Get soil data with parameters
 * const soilData = await soilAPI.getSoilData({ 
 *   start: '2024-01-01', 
 *   end: '2024-12-31', 
 *   limit: 100 
 * });
 */

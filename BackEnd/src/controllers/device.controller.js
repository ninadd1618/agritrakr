import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Device } from '../models/Device.model.js';

// Get all devices for a user
const getUserDevices = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  console.log('📱 Fetching devices for user:', userId);

  const devices = await Device.find({ 
    userId, 
    isActive: true 
  }).sort({ createdAt: -1 });

  console.log(`📱 Found ${devices.length} devices for user: ${userId}`);

  return res.status(200).json(
    new ApiResponse(200, devices, "Devices fetched successfully")
  );
});

// Add a new device
const addDevice = asyncHandler(async (req, res) => {
  const { name, deviceId, mode, location, description } = req.body;
  const userId = req.user._id;

  console.log('📱 Adding new device:', { name, deviceId, mode, userId });

  // Validate required fields
  if (!name || !deviceId) {
    throw new ApiError(400, "Device name and device ID are required");
  }

  // Validate mode
  if (mode && !['survey', 'fit_and_forget'].includes(mode)) {
    throw new ApiError(400, "Invalid device mode. Must be 'survey' or 'fit_and_forget'");
  }

  // Check if device ID already exists
  const existingDevice = await Device.findOne({ deviceId });
  if (existingDevice) {
    throw new ApiError(400, "Device ID already exists");
  }

  // Create new device
  const newDevice = await Device.create({
    userId,
    name,
    deviceId,
    mode: mode || 'survey',
    location,
    description,
  });

  console.log('✅ Device created successfully:', newDevice._id);

  return res.status(201).json(
    new ApiResponse(201, newDevice, "Device added successfully")
  );
});

// Update a device
const updateDevice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, mode, location, description } = req.body;
  const userId = req.user._id;

  console.log('📱 Updating device:', id);

  // Find device and ensure it belongs to the user
  const device = await Device.findOne({ _id: id, userId, isActive: true });
  
  if (!device) {
    throw new ApiError(404, "Device not found or you don't have permission to update it");
  }

  // Validate mode if provided
  if (mode && !['survey', 'fit_and_forget'].includes(mode)) {
    throw new ApiError(400, "Invalid device mode. Must be 'survey' or 'fit_and_forget'");
  }

  // Update device fields
  const updateData = {};
  if (name) updateData.name = name;
  if (mode) updateData.mode = mode;
  if (location !== undefined) updateData.location = location;
  if (description !== undefined) updateData.description = description;

  const updatedDevice = await Device.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  console.log('✅ Device updated successfully:', updatedDevice._id);

  return res.status(200).json(
    new ApiResponse(200, updatedDevice, "Device updated successfully")
  );
});

// Delete a device (soft delete)
const deleteDevice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  console.log('📱 Deleting device:', id);

  // Find device and ensure it belongs to the user
  const device = await Device.findOne({ _id: id, userId, isActive: true });
  
  if (!device) {
    throw new ApiError(404, "Device not found or you don't have permission to delete it");
  }

  // Soft delete by setting isActive to false
  await Device.findByIdAndUpdate(id, { isActive: false });

  console.log('✅ Device deleted successfully:', id);

  return res.status(200).json(
    new ApiResponse(200, {}, "Device deleted successfully")
  );
});

// Get device by ID
const getDeviceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  console.log('📱 Fetching device by ID:', id);

  const device = await Device.findOne({ _id: id, userId, isActive: true });
  
  if (!device) {
    throw new ApiError(404, "Device not found");
  }

  return res.status(200).json(
    new ApiResponse(200, device, "Device fetched successfully")
  );
});

// Update device status (for MQTT integration)
const updateDeviceStatus = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { status } = req.body;

  console.log('📱 Updating device status:', { deviceId, status });

  if (!['online', 'offline', 'maintenance'].includes(status)) {
    throw new ApiError(400, "Invalid status. Must be 'online', 'offline', or 'maintenance'");
  }

  const device = await Device.findOneAndUpdate(
    { deviceId, isActive: true },
    { 
      status,
      lastSeen: new Date()
    },
    { new: true }
  );

  if (!device) {
    throw new ApiError(404, "Device not found");
  }

  console.log('✅ Device status updated:', device.deviceId, device.status);

  return res.status(200).json(
    new ApiResponse(200, device, "Device status updated successfully")
  );
});

export {
  getUserDevices,
  addDevice,
  updateDevice,
  deleteDevice,
  getDeviceById,
  updateDeviceStatus,
};

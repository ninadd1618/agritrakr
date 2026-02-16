import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { SoilData } from '../models/SoilData.model.js';
import { appLogger } from '../config/logger.js';
import { soilService } from '../services/soil.service.js';
console.log("SOIL CONTROLLER LOADED");

const getSoilData = asyncHandler(async (req, res) => {
  const { deviceId, limit, start, end } = req.query;

  // Build query filter
  const filter = {};

  if (deviceId) {
    filter.deviceId = deviceId;
  }

  // Add date range filter if provided
  if (start || end) {
    filter.timestamp = {};
    if (start) {
      filter.timestamp.$gte = new Date(start);
    }
    if (end) {
      filter.timestamp.$lte = new Date(end);
    }
  }

  // Fetch soil data with optional filters
  const query = SoilData.find(filter).sort({ timestamp: -1 });

  if (limit) {
    query.limit(parseInt(limit));
  }

  const soilData = await query.lean();

  return res.status(200).json(new ApiResponse(200, soilData, "Soil data fetched successfully"));
});

const getIdealSoilData = asyncHandler(async (req, res) => {
  // Return ideal soil values matching the constants used in calculations
  const idealData = {
    moisture: 50,        // percent
    pH: 6.5,             // optimal pH
    temp: 20,            // degrees Celsius
    phosphorus: 70,      // ideal level in ppm
    sulfur: 60,          // ideal level in ppm
    zinc: 60,            // ideal level in ppm
    iron: 60,            // ideal level in ppm
    manganese: 60,       // ideal level in ppm
    copper: 60,          // ideal level in ppm
    potassium: 210,      // ideal level in ppm
    calcium: 1800,       // ideal level in ppm
    magnesium: 280,      // ideal level in ppm
    sodium: 30           // ideal level in ppm
  };

  return res.status(200).json(new ApiResponse(200, idealData, "Ideal soil data fetched successfully"));
});

const createSoilData = asyncHandler(async (req, res) => {
  const { deviceId, moisture, temperature, pH, nitrogen, phosphorus, potassium } = req.body;

  if (!deviceId || [moisture, temperature, pH, nitrogen, phosphorus, potassium].some(field => field === undefined || field === null)) {
    throw new ApiError(400, "All soil data fields are required");
  }

  const newSoilData = await soilService.createSoilData({
    deviceId,
    moisture,
    temperature,
    pH,
    nitrogen,
    phosphorus,
    potassium,
  });

  return res.status(201).json(new ApiResponse(201, newSoilData, "Soil data created successfully"));
});

export {
  getSoilData,
  getIdealSoilData,
  createSoilData,
};

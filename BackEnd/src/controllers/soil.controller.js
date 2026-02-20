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
  // Aligned with typical agricultural soil testing standards
  const idealData = {
    moisture: 50,        // percent
    pH: 6.5,             // optimal pH
    temperature: 20,     // degrees Celsius
    nitrogen: 150,       // ideal level in ppm
    phosphorus: 70,      // ideal level in ppm
    sulfur: 25,          // ideal level in ppm
    zinc: 4,             // ideal level in ppm (typical range 1-6)
    iron: 35,            // ideal level in ppm (typical range 10-60)
    manganese: 15,       // ideal level in ppm (typical range 5-25)
    copper: 6,           // ideal level in ppm (typical range 2-12)
    potassium: 210,      // ideal level in ppm
    calcium: 1800,       // ideal level in ppm
    magnesium: 280,      // ideal level in ppm
    sodium: 30           // ideal level in ppm
  };

  return res.status(200).json(new ApiResponse(200, idealData, "Ideal soil data fetched successfully"));
});

const createSoilData = asyncHandler(async (req, res) => {
  const { deviceId, moisture, temperature, pH, nitrogen, phosphorus, potassium, sulfur, zinc, iron, manganese, copper, calcium, magnesium, sodium } = req.body;

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
    sulfur,
    zinc,
    iron,
    manganese,
    copper,
    calcium,
    magnesium,
    sodium,
  });

  return res.status(201).json(new ApiResponse(201, newSoilData, "Soil data created successfully"));
});

export {
  getSoilData,
  getIdealSoilData,
  createSoilData,
};

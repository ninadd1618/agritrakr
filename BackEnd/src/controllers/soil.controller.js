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
  // In a real application, ideal soil data might come from a configuration
  // or another service. For now, we'll return a hardcoded example.
  const idealData = {
    moisture: { min: 30, max: 60 },
    temperature: { min: 15, max: 25 },
    pH: { min: 6.0, max: 7.5 },
    nitrogen: { min: 100, max: 200 },
    phosphorus: { min: 50, max: 100 },
    potassium: { min: 150, max: 300 },
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

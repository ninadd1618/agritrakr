import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { SoilData } from '../models/SoilData.model.js';
import { CropIdeal } from '../models/CropIdeal.model.js';
import { appLogger } from '../config/logger.js';
import { soilService } from '../services/soil.service.js';
import {
  buildCropIdealPayload,
  ensureSingleActiveCrop,
  resolveIdealContext,
} from '../services/cropIdeal.service.js';
console.log("SOIL CONTROLLER LOADED");

const getSoilData = asyncHandler(async (req, res) => {
  const { deviceId, limit, start, end, farmId } = req.query;

  // Build query filter
  const filter = {};

  if (deviceId) filter.deviceId = deviceId;
  if (farmId) filter.farmId = farmId;

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
  const { cropId, cropName } = req.query;
  const { crop, ideals } = await resolveIdealContext({ cropId, cropName });

  return res.status(200).json(new ApiResponse(200, {
    ...ideals,
    cropId: crop?._id || null,
    cropName: crop?.name || null,
    isActive: crop?.isActive || false,
  }, "Ideal soil data fetched successfully"));
});

const getCropIdeals = asyncHandler(async (req, res) => {
  const crops = await CropIdeal.find({}).sort({ updatedAt: -1 }).lean();
  return res.status(200).json(new ApiResponse(200, crops, 'Crop ideals fetched successfully'));
});

const createCropIdeal = asyncHandler(async (req, res) => {
  const payload = buildCropIdealPayload(req.body);

  if (!payload.name) {
    throw new ApiError(400, 'Crop name is required');
  }

  const existing = await CropIdeal.findOne({ name: new RegExp(`^${payload.name}$`, 'i') }).lean();
  if (existing) {
    throw new ApiError(409, 'Crop already exists');
  }

  const total = await CropIdeal.countDocuments();
  if (total === 0) {
    payload.isActive = true;
  }

  const created = await CropIdeal.create(payload);
  if (created.isActive) {
    await ensureSingleActiveCrop(created._id);
  }

  return res.status(201).json(new ApiResponse(201, created, 'Crop created successfully'));
});

const updateCropIdeal = asyncHandler(async (req, res) => {
  const { cropId } = req.params;
  const payload = buildCropIdealPayload(req.body);

  if (payload.name) {
    const duplicate = await CropIdeal.findOne({
      _id: { $ne: cropId },
      name: new RegExp(`^${payload.name}$`, 'i'),
    }).lean();

    if (duplicate) {
      throw new ApiError(409, 'Crop name already exists');
    }
  }

  const updated = await CropIdeal.findByIdAndUpdate(cropId, payload, { new: true, runValidators: true });
  if (!updated) {
    throw new ApiError(404, 'Crop not found');
  }

  if (updated.isActive) {
    await ensureSingleActiveCrop(updated._id);
  }

  return res.status(200).json(new ApiResponse(200, updated, 'Crop updated successfully'));
});

const deleteCropIdeal = asyncHandler(async (req, res) => {
  const { cropId } = req.params;

  const deleted = await CropIdeal.findByIdAndDelete(cropId);
  if (!deleted) {
    throw new ApiError(404, 'Crop not found');
  }

  if (deleted.isActive) {
    const fallback = await CropIdeal.findOne({}).sort({ updatedAt: -1 });
    if (fallback) {
      fallback.isActive = true;
      await fallback.save();
      await ensureSingleActiveCrop(fallback._id);
    }
  }

  return res.status(200).json(new ApiResponse(200, { _id: cropId }, 'Crop deleted successfully'));
});

const createSoilData = asyncHandler(async (req, res) => {
  const {
    deviceId, moisture, temperature, pH, nitrogen, phosphorus, potassium,
    sulfur, zinc, iron, manganese, copper, calcium, magnesium, sodium,
    farmId, latitude, longitude,
  } = req.body;

  if (!deviceId || [moisture, temperature, pH, nitrogen, phosphorus, potassium].some(field => field === undefined || field === null)) {
    throw new ApiError(400, "All soil data fields are required");
  }

  const newSoilData = await soilService.createSoilData({
    deviceId,
    farmId: farmId || null,
    latitude: latitude !== undefined ? Number(latitude) : null,
    longitude: longitude !== undefined ? Number(longitude) : null,
    moisture, temperature, pH, nitrogen, phosphorus, potassium,
    sulfur, zinc, iron, manganese, copper, calcium, magnesium, sodium,
  });

  return res.status(201).json(new ApiResponse(201, newSoilData, "Soil data created successfully"));
});

/**
 * GET /api/v1/soil/farm/:farmId
 * Returns geo-tagged soil readings for a specific farm (for map visualization)
 */
const getSoilDataByFarm = asyncHandler(async (req, res) => {
  const { farmId } = req.params;
  const { limit = 100 } = req.query;

  const readings = await SoilData
    .find({ farmId, latitude: { $ne: null }, longitude: { $ne: null } })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .lean();

  return res.status(200).json(new ApiResponse(200, readings, 'Farm soil data fetched successfully'));
});

export {
  getSoilData,
  getSoilDataByFarm,
  getIdealSoilData,
  createSoilData,
  getCropIdeals,
  createCropIdeal,
  updateCropIdeal,
  deleteCropIdeal,
};

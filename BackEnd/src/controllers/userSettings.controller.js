import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/User.model.js';
import { Farm } from '../models/Farm.model.js';

// ─── User Profile ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/settings/profile
 * Returns the logged-in user's profile (no password / refreshToken).
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
});

/**
 * PATCH /api/v1/settings/profile
 * Update fullName, farmName, and/or phone for the logged-in user.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, farmName, phone } = req.body;

  // Build update object with only provided fields
  const updateData = {};
  if (fullName !== undefined) updateData.fullName = fullName.trim();
  if (farmName !== undefined) updateData.farmName = farmName.trim();
  if (phone !== undefined) updateData.phone = phone.trim();

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, 'No fields provided to update');
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(new ApiResponse(200, updatedUser, 'Profile updated successfully'));
});

// ─── Farm Settings ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/settings/farms
 * Returns all farms belonging to the logged-in user.
 */
const getFarms = asyncHandler(async (req, res) => {
  const farms = await Farm.find({ userId: req.user._id }).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, farms, 'Farms fetched successfully'));
});

/**
 * POST /api/v1/settings/farms
 * Create a new farm for the logged-in user.
 */
const createFarm = asyncHandler(async (req, res) => {
  const { farmName, latitude, longitude } = req.body;

  if (!farmName?.trim()) {
    throw new ApiError(400, 'Farm name is required');
  }
  if (latitude === undefined || latitude === null) {
    throw new ApiError(400, 'Latitude is required');
  }
  if (longitude === undefined || longitude === null) {
    throw new ApiError(400, 'Longitude is required');
  }

  const farm = await Farm.create({
    userId: req.user._id,
    farmName: farmName.trim(),
    latitude: Number(latitude),
    longitude: Number(longitude),
  });

  return res.status(201).json(new ApiResponse(201, farm, 'Farm created successfully'));
});

/**
 * PUT /api/v1/settings/farms/:id
 * Update a farm — only allowed if it belongs to the logged-in user.
 */
const updateFarm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { farmName, latitude, longitude } = req.body;

  const updateData = {};
  if (farmName !== undefined) updateData.farmName = farmName.trim();
  if (latitude !== undefined) updateData.latitude = Number(latitude);
  if (longitude !== undefined) updateData.longitude = Number(longitude);

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, 'No fields provided to update');
  }

  const farm = await Farm.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!farm) {
    throw new ApiError(404, 'Farm not found or access denied');
  }

  return res.status(200).json(new ApiResponse(200, farm, 'Farm updated successfully'));
});

/**
 * DELETE /api/v1/settings/farms/:id
 * Delete a farm — only allowed if it belongs to the logged-in user.
 */
const deleteFarm = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const farm = await Farm.findOneAndDelete({ _id: id, userId: req.user._id });

  if (!farm) {
    throw new ApiError(404, 'Farm not found or access denied');
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Farm deleted successfully'));
});

// ─── Farm Boundary ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/settings/farms/:id/boundary
 * Returns the polygon boundary for a specific farm.
 */
const getBoundary = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const farm = await Farm.findOne({ _id: id, userId: req.user._id }).select('boundary farmName');

  if (!farm) {
    throw new ApiError(404, 'Farm not found or access denied');
  }

  return res.status(200).json(new ApiResponse(200, { boundary: farm.boundary, farmName: farm.farmName }, 'Boundary fetched successfully'));
});

/**
 * PUT /api/v1/settings/farms/:id/boundary
 * Save (overwrite) the polygon boundary for a farm.
 * Body: { boundary: [{lat, lng}, ...] }
 */
const saveBoundary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { boundary } = req.body;

  if (!Array.isArray(boundary)) {
    throw new ApiError(400, 'Boundary must be an array of {lat, lng} points');
  }

  // Validate each point
  for (const point of boundary) {
    if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
      throw new ApiError(400, 'Each boundary point must have numeric lat and lng');
    }
  }

  const farm = await Farm.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { $set: { boundary } },
    { new: true, runValidators: true }
  );

  if (!farm) {
    throw new ApiError(404, 'Farm not found or access denied');
  }

  return res.status(200).json(new ApiResponse(200, farm, 'Boundary saved successfully'));
});

export { getProfile, updateProfile, getFarms, createFarm, updateFarm, deleteFarm, getBoundary, saveBoundary };


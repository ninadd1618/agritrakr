import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { FinalData } from '../models/FinalData.model.js';
import { SoilData } from '../models/SoilData.model.js';

/**
 * Get plant/crop report data with date range filtering
 * @route GET /api/v1/reports/plant
 * @query {string} start - Start date (ISO format)
 * @query {string} stop - End date (ISO format)
 */
export const getPlantReport = asyncHandler(async (req, res) => {
    const { start, stop } = req.query;

    // Build date filter if provided
    const dateFilter = {};
    if (start || stop) {
        dateFilter.timestamp = {};
        if (start) {
            dateFilter.timestamp.$gte = new Date(start);
        }
        if (stop) {
            dateFilter.timestamp.$lte = new Date(stop);
        }
    }

    // Fetch data from FinalData collection
    const records = await FinalData.find(dateFilter)
        .sort({ timestamp: -1 })
        .limit(1000)
        .lean();

    // Transform OEE/Quality data to plant report format
    // This maps your existing OEE data to the expected crop report structure
    const transformedData = records.map(record => ({
        crop: `Crop-${record.deviceId}`, // Use deviceId as crop identifier
        cropType: 'Industrial Crop',
        farmPlot: `Plot-${record.deviceId}`,
        location: `Location-${record.deviceId}`,
        growthStage: getGrowthStage(record.performance),
        stage: getGrowthStage(record.performance),
        healthStatus: getHealthStatus(record.quality),
        health: getHealthStatus(record.quality),
        status: getHealthStatus(record.quality),
        estimatedYield: calculateYield(record.quality, record.performance),
        yield: calculateYield(record.quality, record.performance),
        productivity: record.performance || 0,
        lastScan: record.timestamp || record.createdAt,
        scanDate: record.timestamp || record.createdAt,
        // Include original OEE data
        deviceId: record.deviceId,
        oee: record.oee,
        availability: record.availability,
        performance: record.performance,
        quality: record.quality,
    }));

    return res.status(200).json(
        new ApiResponse(200, transformedData, 'Plant report data retrieved successfully')
    );
});

/**
 * Helper function to determine growth stage based on performance
 */
function getGrowthStage(performance) {
    if (!performance) return 'Unknown';
    if (performance >= 90) return 'Mature';
    if (performance >= 70) return 'Flowering';
    if (performance >= 50) return 'Vegetative';
    return 'Seedling';
}

/**
 * Helper function to calculate health status based on quality
 */
function getHealthStatus(quality) {
    if (!quality) return 'Unknown';
    if (quality >= 85) return 'Healthy';
    if (quality >= 70) return 'Fair';
    if (quality >= 50) return 'Poor';
    return 'Unhealthy';
}

/**
 * Helper function to calculate estimated yield
 */
function calculateYield(quality, performance) {
    if (!quality || !performance) return 0;
    // Example calculation: combine quality and performance for yield estimate (kg/ha)
    return Math.round((quality * performance) / 10);
}

/**
 * Get soil report data with date range filtering
 * @route GET /api/v1/reports/soil
 * @query {string} start - Start date (ISO format)
 * @query {string} stop - End date (ISO format)
 */
export const getSoilReport = asyncHandler(async (req, res) => {
    const { start, stop } = req.query;

    const dateFilter = {};
    if (start || stop) {
        dateFilter.timestamp = {};
        if (start) {
            dateFilter.timestamp.$gte = new Date(start);
        }
        if (stop) {
            dateFilter.timestamp.$lte = new Date(stop);
        }
    }

    const soilData = await SoilData.find(dateFilter)
        .sort({ timestamp: -1 })
        .limit(1000)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, soilData, 'Soil report data retrieved successfully')
    );
});

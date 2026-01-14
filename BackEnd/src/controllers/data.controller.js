import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { SoilData } from '../models/SoilData.model.js';
import { FinalData } from '../models/FinalData.model.js';
import { appLogger } from '../config/logger.js';

// Bulk upload soil nutrients data
const bulkUploadSoilData = asyncHandler(async (req, res) => {
  const { data } = req.body;

  if (!data || !Array.isArray(data) || data.length === 0) {
    throw new ApiError(400, "Data array is required");
  }

  // Validate required fields for each record
  for (const record of data) {
    const { deviceId, moisture, temperature, pH, nitrogen, phosphorus, potassium } = record;
    
    if (!deviceId || [moisture, temperature, pH, nitrogen, phosphorus, potassium].some(field => field === undefined || field === null)) {
      throw new ApiError(400, "All soil data fields are required for each record");
    }
  }

  const insertedData = await SoilData.insertMany(data);

  return res.status(201).json(new ApiResponse(201, {
    insertedCount: insertedData.length,
    data: insertedData
  }, "Soil data uploaded successfully"));
});

// Bulk upload OEE/PLC data
const bulkUploadFinalData = asyncHandler(async (req, res) => {
  const { data } = req.body;

  if (!data || !Array.isArray(data) || data.length === 0) {
    throw new ApiError(400, "Data array is required");
  }

  // Validate required fields for each record
  for (const record of data) {
    const { deviceId } = record;
    
    if (!deviceId) {
      throw new ApiError(400, "Device ID is required for each record");
    }
  }

  const insertedData = await FinalData.insertMany(data);

  return res.status(201).json(new ApiResponse(201, {
    insertedCount: insertedData.length,
    data: insertedData
  }, "Final data uploaded successfully"));
});

// Upload data from CSV/JSON file
const uploadDataFromFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const { dataType } = req.body; // 'soil' or 'final'
  
  if (!['soil', 'final'].includes(dataType)) {
    throw new ApiError(400, "Data type must be 'soil' or 'final'");
  }

  // Parse file content based on type
  let data;
  try {
    const fileContent = req.file.buffer.toString('utf8');
    
    if (req.file.originalname.endsWith('.json')) {
      data = JSON.parse(fileContent);
    } else if (req.file.originalname.endsWith('.csv')) {
      // Simple CSV parsing (you might want to use a proper CSV parser)
      const lines = fileContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
          const value = values[index];
          // Try to parse as number, otherwise keep as string
          obj[header] = isNaN(value) ? value : parseFloat(value);
        });
        return obj;
      });
    } else {
      throw new ApiError(400, "Only JSON and CSV files are supported");
    }
  } catch (error) {
    throw new ApiError(400, "Error parsing file: " + error.message);
  }

  // Insert data based on type
  let result;
  if (dataType === 'soil') {
    result = await SoilData.insertMany(data);
  } else {
    result = await FinalData.insertMany(data);
  }

  return res.status(201).json(new ApiResponse(201, {
    insertedCount: result.length,
    dataType,
    filename: req.file.originalname
  }, `${dataType} data uploaded successfully from file`));
});

// Get data statistics
const getDataStats = asyncHandler(async (req, res) => {
  const { deviceId } = req.query;

  const soilFilter = deviceId ? { deviceId } : {};
  const finalFilter = deviceId ? { deviceId } : {};

  const [soilCount, finalCount, latestSoil, latestFinal] = await Promise.all([
    SoilData.countDocuments(soilFilter),
    FinalData.countDocuments(finalFilter),
    SoilData.findOne(soilFilter).sort({ timestamp: -1 }),
    FinalData.findOne(finalFilter).sort({ timestamp: -1 })
  ]);

  const stats = {
    soilData: {
      totalRecords: soilCount,
      latestRecord: latestSoil?.timestamp || null,
      devices: await SoilData.distinct('deviceId')
    },
    finalData: {
      totalRecords: finalCount,
      latestRecord: latestFinal?.timestamp || null,
      devices: await FinalData.distinct('deviceId')
    }
  };

  return res.status(200).json(new ApiResponse(200, stats, "Data statistics fetched successfully"));
});

export {
  bulkUploadSoilData,
  bulkUploadFinalData,
  uploadDataFromFile,
  getDataStats
};

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { SoilData } from '../models/SoilData.model.js';
import { resolveIdealContext } from '../services/cropIdeal.service.js';

// POST /soil/data - ingest a reading
const ingestReading = asyncHandler(async (req, res) => {
    const payload = req.body;
    if (!payload || !payload.timestamp) {
        throw new ApiError(400, 'Invalid payload - timestamp required');
    }

    const doc = new SoilData({
        sensorId: payload.sensorId,
        timestamp: new Date(payload.timestamp),
        moisture: payload.moisture,
        pH: payload.pH,
        temp: payload.temp,
        nitrogen: payload.nitrogen,
        phosphorus: payload.phosphorus,
        sulfur: payload.sulfur,
        zinc: payload.zinc,
        iron: payload.iron,
        manganese: payload.manganese,
        copper: payload.copper,
        potassium: payload.potassium,
        calcium: payload.calcium,
        magnesium: payload.magnesium,
        sodium: payload.sodium
    });

    await doc.save();
    return res.status(201).json({ status: 201, data: doc, message: 'Reading saved' });
});

// GET /soil/data - query readings
const queryReadings = asyncHandler(async (req, res) => {
    const { start, end, sensorId, deviceId, limit = 100 } = req.query;
    const filter = {};
    if (deviceId) filter.deviceId = deviceId;
    if (sensorId) filter.deviceId = sensorId; // support legacy sensorId param
    if (start || end) filter.timestamp = {};
    if (start) filter.timestamp.$gte = new Date(start);
    if (end) filter.timestamp.$lte = new Date(end);

    const docs = await SoilData.find(filter).sort({ timestamp: 1 }).limit(parseInt(limit, 10));
    return res.status(200).json({ status: 200, data: docs });
});

// GET /soil/ideals - resolve ideals from active crop, fallback to defaults
const getIdeals = asyncHandler(async (req, res) => {
    const { cropId, cropName } = req.query;
    const { crop, ideals } = await resolveIdealContext({ cropId, cropName });
    return res.status(200).json({
        status: 200,
        data: {
            ...ideals,
            cropId: crop?._id || null,
            cropName: crop?.name || null,
            isActive: crop?.isActive || false,
        }
    });
});

// GET /soil/table - table-ready data for reports (macro/micro, count/percentage)
const getTableView = asyncHandler(async (req, res) => {
    const { start, end, sensorId, deviceId, limit = 50, type = 'macro', mode = 'count' } = req.query;
    const filter = {};
    if (deviceId) filter.deviceId = deviceId;
    if (sensorId) filter.deviceId = sensorId; // support legacy sensorId param
    if (start || end) filter.timestamp = {};
    if (start) filter.timestamp.$gte = new Date(start);
    if (end) filter.timestamp.$lte = new Date(end);

    const docs = await SoilData.find(filter).sort({ timestamp: 1 }).limit(parseInt(limit, 10));

    const macroKeys = ['phosphorus', 'potassium', 'calcium', 'magnesium', 'sulfur'];
    const microKeys = ['nitrogen', 'iron', 'manganese', 'zinc', 'copper'];
    const keys = type === 'micro' ? microKeys : macroKeys;

    const { ideals } = await resolveIdealContext({});

    const rows = docs.map(d => {
        const row = { date: d.timestamp };
        keys.forEach(k => {
            const v = d[k] ?? null;
            if (v === null || typeof v !== 'number') {
                row[k] = null;
            } else if (mode === 'percentage') {
                const ideal = ideals[k] || 0;
                // Calculate percentage and cap it at 100
                const percentage = ideal > 0 ? (v / ideal) * 100 : 0;
                row[k] = ideal > 0 ? Number(Math.min(percentage, 100).toFixed(1)) : null;
            } else {
                row[k] = v;
            }
        });
        return row;
    });

    return res.status(200).json({ status: 200, data: { type, mode, columns: ['date', ...keys], rows } });
});

export { ingestReading, queryReadings, getIdeals, getTableView };

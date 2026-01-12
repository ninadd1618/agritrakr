import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { SoilData } from '../models/SoilData.model.js';
import { IDEAL_SOIL_VALUES } from '../utils/constants.js';

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
    const { start, end, sensorId, limit = 100 } = req.query;
    const filter = {};
    if (sensorId) filter.sensorId = sensorId;
    if (start || end) filter.timestamp = {};
    if (start) filter.timestamp.$gte = new Date(start);
    if (end) filter.timestamp.$lte = new Date(end);

    const docs = await SoilData.find(filter).sort({ timestamp: 1 }).limit(parseInt(limit, 10));
    return res.status(200).json({ status: 200, data: docs });
});

// GET /soil/ideals - return hardcoded ideal targets
const getIdeals = asyncHandler(async (req, res) => {
    return res.status(200).json({ status: 200, data: IDEAL_SOIL_VALUES });
});

// GET /soil/table - table-ready data for reports (macro/micro, count/percentage)
const getTableView = asyncHandler(async (req, res) => {
    const { start, end, sensorId, limit = 50, type = 'macro', mode = 'count' } = req.query;
    const filter = {};
    if (sensorId) filter.sensorId = sensorId;
    if (start || end) filter.timestamp = {};
    if (start) filter.timestamp.$gte = new Date(start);
    if (end) filter.timestamp.$lte = new Date(end);

    const docs = await SoilData.find(filter).sort({ timestamp: 1 }).limit(parseInt(limit, 10));

    const macroKeys = ['phosphorus', 'potassium', 'calcium', 'magnesium', 'sulfur'];
    const microKeys = ['iron', 'manganese', 'zinc', 'copper', 'sodium'];
    const keys = type === 'micro' ? microKeys : macroKeys;

    const ideals = IDEAL_SOIL_VALUES || {};

    const rows = docs.map(d => {
        const row = { date: d.timestamp };
        keys.forEach(k => {
            const v = d[k] ?? null;
            if (v === null || typeof v !== 'number') {
                row[k] = null;
            } else if (mode === 'percentage') {
                const ideal = ideals[k] || 0;
                row[k] = ideal > 0 ? Number(((v / ideal) * 100).toFixed(1)) : null;
            } else {
                row[k] = v;
            }
        });
        return row;
    });

    return res.status(200).json({ status: 200, data: { type, mode, columns: ['date', ...keys], rows } });
});

export { ingestReading, queryReadings, getIdeals, getTableView };

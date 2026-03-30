import { CropIdeal } from '../models/CropIdeal.model.js';
import { IDEAL_SOIL_VALUES } from '../utils/constants.js';

export const IDEAL_KEYS = [
    'moisture',
    'pH',
    'temperature',
    'nitrogen',
    'phosphorus',
    'sulfur',
    'zinc',
    'iron',
    'manganese',
    'copper',
    'potassium',
    'calcium',
    'magnesium',
    'sodium',
];

const toFiniteNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

export const buildCropIdealPayload = (input = {}) => {
    const payload = {};

    if (typeof input.name === 'string') {
        payload.name = input.name.trim();
    }

    if (typeof input.isActive === 'boolean') {
        payload.isActive = input.isActive;
    }

    IDEAL_KEYS.forEach((key) => {
        if (input[key] !== undefined) {
            const parsed = toFiniteNumber(input[key]);
            if (parsed !== null) payload[key] = parsed;
        }
    });

    return payload;
};

const normalizeIdeals = (source = {}) => {
    const merged = { ...IDEAL_SOIL_VALUES, ...source };
    return {
        moisture: merged.moisture,
        pH: merged.pH,
        temperature: merged.temperature ?? merged.temp,
        temp: merged.temperature ?? merged.temp,
        nitrogen: merged.nitrogen,
        phosphorus: merged.phosphorus,
        sulfur: merged.sulfur,
        zinc: merged.zinc,
        iron: merged.iron,
        manganese: merged.manganese,
        copper: merged.copper,
        potassium: merged.potassium,
        calcium: merged.calcium,
        magnesium: merged.magnesium,
        sodium: merged.sodium,
    };
};

const findRequestedCrop = async ({ cropId, cropName } = {}) => {
    if (cropId) {
        return CropIdeal.findById(cropId).lean();
    }

    if (cropName) {
        return CropIdeal.findOne({ name: new RegExp(`^${cropName}$`, 'i') }).lean();
    }

    return null;
};

const findActiveOrLatestCrop = async () => {
    const activeCrop = await CropIdeal.findOne({ isActive: true }).lean();
    if (activeCrop) return activeCrop;
    return CropIdeal.findOne({}).sort({ updatedAt: -1 }).lean();
};

export const resolveIdealContext = async ({ cropId, cropName } = {}) => {
    const requestedCrop = await findRequestedCrop({ cropId, cropName });
    const selectedCrop = requestedCrop || (await findActiveOrLatestCrop());

    return {
        crop: selectedCrop,
        ideals: normalizeIdeals(selectedCrop || {}),
    };
};

export const ensureSingleActiveCrop = async (activeCropId) => {
    if (!activeCropId) return;
    await CropIdeal.updateMany({ _id: { $ne: activeCropId } }, { $set: { isActive: false } });
};

import mongoose, { Schema } from 'mongoose';

const cropIdealSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: false,
            index: true,
        },
        moisture: { type: Number },
        pH: { type: Number },
        temperature: { type: Number },
        nitrogen: { type: Number },
        phosphorus: { type: Number },
        sulfur: { type: Number },
        zinc: { type: Number },
        iron: { type: Number },
        manganese: { type: Number },
        copper: { type: Number },
        potassium: { type: Number },
        calcium: { type: Number },
        magnesium: { type: Number },
        sodium: { type: Number },
    },
    { timestamps: true }
);

export const CropIdeal = mongoose.model('CropIdeal', cropIdealSchema);

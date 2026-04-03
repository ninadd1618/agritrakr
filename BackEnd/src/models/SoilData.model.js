import mongoose, { Schema } from 'mongoose';

const soilDataSchema = new Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      index: true,
      default: null,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    moisture: {
      type: Number,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    temp: {
      type: Number,
    },
    pH: {
      type: Number,
      required: true,
    },
    nitrogen: {
      type: Number,
      required: true,
    },
    phosphorus: {
      type: Number,
      required: true,
    },
    potassium: {
      type: Number,
      required: true,
    },
    sulfur: {
      type: Number,
    },
    zinc: {
      type: Number,
    },
    iron: {
      type: Number,
    },
    manganese: {
      type: Number,
    },
    copper: {
      type: Number,
    },
    calcium: {
      type: Number,
    },
    magnesium: {
      type: Number,
    },
    sodium: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const SoilData = mongoose.model('SoilData', soilDataSchema);

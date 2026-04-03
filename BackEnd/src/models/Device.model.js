import mongoose, { Schema } from 'mongoose';

const deviceSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    mode: {
      type: String,
      required: true,
      enum: ['survey', 'fit_and_forget'],
      default: 'survey',
      index: true,
    },
    location: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'maintenance'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
deviceSchema.index({ userId: 1, isActive: 1 });
deviceSchema.index({ deviceId: 1, userId: 1 });

export const Device = mongoose.model('Device', deviceSchema);

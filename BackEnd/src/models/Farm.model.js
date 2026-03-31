import mongoose, { Schema } from 'mongoose';

const farmSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    farmName: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    boundary: {
      type: [
        {
          lat: { type: Number, required: true },
          lng: { type: Number, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Farm = mongoose.model('Farm', farmSchema);

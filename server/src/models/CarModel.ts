import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { CONNECTOR_TYPES } from '../utils/constants';

const carModelSchema = new Schema(
  {
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    batteryCapacityKWh: { type: Number, required: true, min: 1 },
    supportedConnectors: {
      type: [{ type: String, enum: CONNECTOR_TYPES }],
      default: [],
    },
    maxChargingPowerKW: { type: Number, required: true, min: 1 },
    // Optional cosmetic fields for nicer UI
    rangeKm: { type: Number, default: null },
    imageColor: { type: String, default: '#16a34a' },
  },
  { timestamps: true },
);

carModelSchema.index({ brand: 1, model: 1 }, { unique: true });

export type CarModelDoc = HydratedDocument<InferSchemaType<typeof carModelSchema>>;
export const CarModel = model('CarModel', carModelSchema);

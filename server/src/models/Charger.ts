import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { CONNECTOR_TYPES, CHARGER_STATUSES, AMENITIES } from '../utils/constants';

const chargerSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    connectorType: { type: String, enum: CONNECTOR_TYPES, required: true },
    powerKW: { type: Number, required: true, min: 0.1 },
    pricePerKWh: { type: Number, required: true, min: 0 },
    // Daily availability window in IST, stored as "HH:mm".
    availableFrom: { type: String, required: true, default: '06:00' },
    availableUntil: { type: String, required: true, default: '23:00' },
    amenities: { type: [{ type: String, enum: AMENITIES }], default: [] },
    status: { type: String, enum: CHARGER_STATUSES, default: 'active', index: true },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export type ChargerDoc = HydratedDocument<InferSchemaType<typeof chargerSchema>>;
export const Charger = model('Charger', chargerSchema);

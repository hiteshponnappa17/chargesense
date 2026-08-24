import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { BOOKING_STATUSES } from '../utils/constants';

const bookingSchema = new Schema(
  {
    // Human-readable identifier, e.g. "CS-2026-000123" (in addition to _id)
    bookingCode: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chargerId: { type: Schema.Types.ObjectId, ref: 'Charger', required: true, index: true },
    carModelId: { type: Schema.Types.ObjectId, ref: 'CarModel', default: null },

    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },

    currentBatteryPct: { type: Number, min: 0, max: 100, default: null },
    targetBatteryPct: { type: Number, min: 0, max: 100, default: null },
    estimatedEnergyKWh: { type: Number, required: true, min: 0 },
    estimatedCost: { type: Number, required: true, min: 0 },
    chargingTimeMinutes: { type: Number, default: null },

    status: {
      type: String,
      enum: BOOKING_STATUSES,
      required: true,
      default: 'pending',
      index: true,
    },
    // FCFS queue position among waiting requests for a charger (1-based).
    queuePosition: { type: Number, default: null },
    // When the request arrived — drives FCFS ordering (also see createdAt).
    requestedAt: { type: Date, required: true, default: () => new Date() },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Composite index accelerating overlap lookups for a charger's schedule.
bookingSchema.index({ chargerId: 1, startTime: 1 });
bookingSchema.index({ chargerId: 1, status: 1, startTime: 1 });

export type BookingDoc = HydratedDocument<InferSchemaType<typeof bookingSchema>>;
export const Booking = model('Booking', bookingSchema);

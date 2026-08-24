import { Schema, model, Types, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { ROLES } from '../utils/constants';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: 'driver' },
    // Driver's default vehicle (optional) — powers the estimator prefill.
    defaultCarModelId: { type: Schema.Types.ObjectId, ref: 'CarModel', default: null },
    vehicleRegistration: { type: String, default: null, trim: true },
  },
  { timestamps: true },
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model('User', userSchema);
export type UserId = Types.ObjectId;

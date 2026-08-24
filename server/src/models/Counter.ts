import { Schema, model } from 'mongoose';

/**
 * Atomic sequence generator used to mint human-readable booking codes
 * like "CS-2026-000123". One document per named sequence.
 */
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = model('Counter', counterSchema);

/** Atomically increment and return the next value for a named sequence. */
export async function nextSequence(name: string): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).lean();
  return doc!.seq;
}

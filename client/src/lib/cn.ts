export type ClassValue = string | number | null | false | undefined | ClassValue[];

/**
 * Tiny class-name combiner (no external deps). Flattens arrays and drops
 * falsy values, then collapses whitespace. Sufficient for our Tailwind usage.
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v && v !== 0) return;
    if (Array.isArray(v)) {
      v.forEach(walk);
    } else {
      out.push(String(v));
    }
  };
  inputs.forEach(walk);
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Formatting helpers. All date/time output is rendered in IST (Asia/Kolkata)
// regardless of the viewer's timezone, matching how the backend reasons about
// availability windows.
// ---------------------------------------------------------------------------

const IST_TZ = 'Asia/Kolkata';

export function formatCurrency(amount: number | null | undefined): string {
  const n = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function formatEnergy(kwh: number | null | undefined): string {
  const n = typeof kwh === 'number' && Number.isFinite(kwh) ? kwh : 0;
  return `${n.toFixed(2)} kWh`;
}

export function formatDistance(km: number | null | undefined): string | null {
  if (km === null || km === undefined || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatDuration(minutes: number | null | undefined): string {
  const m = typeof minutes === 'number' && minutes > 0 ? Math.round(minutes) : 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm} min`;
  if (mm === 0) return `${h} hr`;
  return `${h} hr ${mm} min`;
}

export function formatTime(iso: string | Date): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    timeZone: IST_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    timeZone: IST_TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | Date): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function formatTimeRange(startISO: string | Date, endISO: string | Date): string {
  return `${formatTime(startISO)} – ${formatTime(endISO)}`;
}

/** IST calendar day number (days since epoch) for "Today"/"Tomorrow" logic. */
function istDayNumber(iso: string | Date): number {
  const d = new Date(iso);
  const istMs = d.getTime() + 330 * 60_000;
  return Math.floor(istMs / 86_400_000);
}

export function relativeDayLabel(iso: string | Date): string {
  const diff = istDayNumber(iso) - istDayNumber(new Date());
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-IN', {
    timeZone: IST_TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** e.g. "Tomorrow · 6:00 PM – 8:00 PM" */
export function formatSlot(startISO: string | Date, endISO: string | Date): string {
  return `${relativeDayLabel(startISO)} · ${formatTimeRange(startISO, endISO)}`;
}

/** Convert an IST wall-clock "YYYY-MM-DD" + "HH:mm" to an ISO instant. */
export function istDateTimeToISO(dateYYYYMMDD: string, hhmm: string): string {
  const [y, mo, d] = dateYYYYMMDD.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  // IST midnight of that date, in UTC ms, then add the wall-clock minutes.
  const dayStartUtcMs = Date.UTC(y, mo - 1, d) - 330 * 60_000;
  return new Date(dayStartUtcMs + (h * 60 + mi) * 60_000).toISOString();
}

/** Today's date in IST as "YYYY-MM-DD" (for date-input min/defaults). */
export function istTodayYYYYMMDD(): string {
  const nowIstMs = Date.now() + 330 * 60_000;
  return new Date(nowIstMs).toISOString().slice(0, 10);
}

/** "HH:mm" (IST) for a given instant — used to prefill slot time inputs. */
export function istHHmm(iso: string | Date): string {
  const d = new Date(iso);
  return new Date(d.getTime() + 330 * 60_000).toISOString().slice(11, 16);
}

/** The IST "YYYY-MM-DD" for a given instant. */
export function istYYYYMMDD(iso: string | Date): string {
  const d = new Date(iso);
  return new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

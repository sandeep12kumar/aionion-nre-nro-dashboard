// Display helpers. Dates are shown in India time.
const TZ = "Asia/Kolkata";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
});
const dateOnly = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const dateTime12 = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
});
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

const valid = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const fmtDateTime = (v) => (valid(v) ? dateTime.format(valid(v)).replace(",", ",") : "N/A");
export const fmtDateTime12 = (v) => (valid(v) ? dateTime12.format(valid(v)).replace(/\b(am|pm)\b/i, (m) => m.toLowerCase()) : "N/A");
export const fmtDate = (v) => (valid(v) ? dateOnly.format(valid(v)) : "N/A");
export const fmtMoney = (v) => (v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? "N/A" : inr.format(Number(v)));

export function fmtDuration(seconds) {
  if (seconds === null || seconds === undefined) return "N/A";
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
}

export const titleCase = (key) =>
  String(key || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bId\b/g, "ID").replace(/\bPan\b/g, "PAN").replace(/\bPdf\b/g, "PDF").replace(/\bIpv\b/g, "IPV")
    .replace(/\bOtp\b/g, "OTP").replace(/\bIfsc\b/g, "IFSC").replace(/\bMicr\b/g, "MICR").replace(/\bItr\b/g, "ITR")
    .replace(/\bRm\b/g, "RM").replace(/\bUrl\b/g, "URL").replace(/\bIp\b/g, "IP").replace(/\bDob\b/g, "DOB")
    .replace(/\bPis\b/g, "PIS").replace(/\bFatca\b/g, "FATCA").replace(/\bBoid\b/g, "BOID");

// Any value for a details list.
export function fmtValue(value, key = "") {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  if (/(_at|_date|date_of_birth|_dob|expiry)$/.test(key) && valid(value)) {
    return /T\d\d:/.test(String(value)) || value instanceof Date ? fmtDateTime(value) : fmtDate(value);
  }
  return String(value);
}

// ISO yyyy-mm-dd from an <input type="date"> is passed through to the API
export const STATUS_LABELS = { in_progress: "In Progress", completed: "Completed", abandoned: "Abandoned" };
export const IPV_STATUS_LABELS = { requested: "Requested", live: "Live", completed: "Completed", cancelled: "Cancelled" };
export const SCHEME_LABELS = { lifeTime: "Lifetime", annualCare: "Annual Care" };

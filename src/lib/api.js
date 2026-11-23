// Calls the dashboard API (dashboard/server). VITE_API_URL is the deployed
// API's base URL (e.g. the Lambda Function URL); empty = same origin (dev proxy).
const BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const TOKEN_KEY = "nri_dash_token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode */
  }
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const query = (params) => {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") search.set(k, Array.isArray(v) ? v.join(",") : String(v));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
};

async function request(method, path, { params, body, raw = false } = {}) {
  const token = getToken();
  let response;
  try {
    response = await fetch(`${BASE}/api${path}${query(params)}`, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection.", 0);
  }
  if (response.status === 401 && path !== "/auth/login") onUnauthorized();
  if (raw && response.ok) return response;
  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await response.json() : null;
  if (!response.ok || data?.success === false) {
    throw new ApiError(data?.message || `Request failed (${response.status})`, response.status, data);
  }
  return data;
}

export const api = {
  get: (path, params) => request("GET", path, { params }),
  post: (path, body) => request("POST", path, { body }),
  patch: (path, body) => request("PATCH", path, { body }),
};

// Saves a CSV export (the API answers with the file).
export async function downloadExport(path, params) {
  const response = await request("GET", path, { params, raw: true });
  const blob = await response.blob();
  const name = /filename="([^"]+)"/.exec(response.headers.get("content-disposition") || "")?.[1] || "export.csv";
  saveBlob(blob, name);
}

export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// A stored file (document / recording / PDF): returns { url, contentType, name }.
// S3 -> a short-lived signed link; local -> a blob: URL of the bytes.
export async function openFile(path, { download = false } = {}) {
  const info = await request("GET", path, { params: { download: download ? "1" : undefined } });
  if (info.url) return info;
  const response = await request("GET", path, { params: { raw: "1", download: download ? "1" : undefined }, raw: true });
  return { ...info, url: URL.createObjectURL(await response.blob()), blob: true };
}

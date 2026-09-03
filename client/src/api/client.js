import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getDistricts = () => api.get("/districts").then((r) => r.data);
export const getRoads = () => api.get("/roads").then((r) => r.data);
export const getAlerts = () => api.get("/alerts").then((r) => r.data);
export const getVehicles = () => api.get("/vehicles").then((r) => r.data);
export const getReports = () => api.get("/reports").then((r) => r.data);
export const submitReport = (payload) => api.post("/reports", payload).then((r) => r.data);
export const getOptimalRoute = (from, to) =>
  api.get("/roads/route", { params: { from, to } }).then((r) => r.data);
export const getSnapshot = () => api.get("/snapshot").then((r) => r.data);

export default api;

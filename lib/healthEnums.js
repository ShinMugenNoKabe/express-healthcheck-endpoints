const healthStatusValues = {
  healthy: "healthy",
  unhealthy: "unhealthy",
  unknown: "unknown"
};
const healthStatusCodes = {
  healthy: 200,
  unhealthy: 503,
  unknown: 500
};
const timeFormats = {
  iso: "iso",
  utc: "utc",
  unix: "unix",
  calendar: "calendar"
};
export { healthStatusValues, healthStatusCodes, timeFormats };
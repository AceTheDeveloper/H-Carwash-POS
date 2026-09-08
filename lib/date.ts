export const APP_TIME_ZONE = "Asia/Manila";

export function getAppDate(value: Date | string = new Date()) {
  return new Date(value).toLocaleDateString("en-CA", {
    timeZone: APP_TIME_ZONE,
  });
}

export function formatAppDateTime(value: Date | string | null) {
  return value
    ? new Date(value).toLocaleString("en-PH", {
        timeZone: APP_TIME_ZONE,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";
}

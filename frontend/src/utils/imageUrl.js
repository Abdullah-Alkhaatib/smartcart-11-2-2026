import API_URL from "../config/api";

export function resolveImageUrl(value) {
  if (!value || typeof value !== "string") return "";

  const normalized = value.trim().replace(/\\/g, "/");
  if (!normalized) return "";

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("data:image/")
  ) {
    return normalized;
  }

  const cleanBaseUrl = API_URL.replace(/\/+$/, "");
  const cleanPath = normalized.replace(/^\/+/, "");
  const imagePath = cleanPath.startsWith("images/")
    ? cleanPath
    : `images/${cleanPath}`;

  return `${cleanBaseUrl}/${imagePath}`;
}

const ARABIC_COLOR_MAP = {
  اسود: "#000000",
  أسود: "#000000",
  ابيض: "#ffffff",
  أبيض: "#ffffff",
  رمادي: "#808080",
  رصاصي: "#808080",
  فضي: "#c0c0c0",
  سيلفر: "#c0c0c0",
  احمر: "#dc2626",
  أحمر: "#dc2626",
  ازرق: "#2563eb",
  أزرق: "#2563eb",
  كحلي: "#1e3a8a",
  نيلي: "#4b0082",
  اخضر: "#16a34a",
  أخضر: "#16a34a",
  اصفر: "#eab308",
  أصفر: "#eab308",
  برتقالي: "#f97316",
  بنفسجي: "#7c3aed",
  وردي: "#ec4899",
  بني: "#92400e",
  ذهبي: "#d4af37",
};

const ENGLISH_COLOR_MAP = {
  black: "#000000",
  white: "#ffffff",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  red: "#dc2626",
  blue: "#2563eb",
  navy: "#1e3a8a",
  indigo: "#4b0082",
  green: "#16a34a",
  yellow: "#eab308",
  orange: "#f97316",
  purple: "#7c3aed",
  pink: "#ec4899",
  brown: "#92400e",
  gold: "#d4af37",
};

const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const normalizeHex = (hex) => {
  if (!HEX_COLOR_REGEX.test(hex)) return null;

  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  return hex.toLowerCase();
};

const getHexRgb = (hex) => {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

const getLuminance = ({ r, g, b }) => {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const getMappedColor = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;

  if (HEX_COLOR_REGEX.test(trimmed)) {
    return normalizeHex(trimmed);
  }

  if (ARABIC_COLOR_MAP[trimmed]) {
    return ARABIC_COLOR_MAP[trimmed];
  }

  const lowered = trimmed.toLowerCase();
  if (ARABIC_COLOR_MAP[lowered]) {
    return ARABIC_COLOR_MAP[lowered];
  }

  if (ENGLISH_COLOR_MAP[lowered]) {
    return ENGLISH_COLOR_MAP[lowered];
  }

  return trimmed;
};

export const getColorChipStyle = (colorName) => {
  const mappedColor = getMappedColor(colorName);
  if (!mappedColor) return undefined;

  const style = { backgroundColor: mappedColor, borderColor: mappedColor };

  const rgb = getHexRgb(mappedColor);
  if (rgb) {
    style.color = getLuminance(rgb) > 0.62 ? "#0f172a" : "#ffffff";
  }

  return style;
};

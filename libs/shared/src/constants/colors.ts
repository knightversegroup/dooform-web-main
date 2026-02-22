/**
 * Centralized color constants for Dooform Web
 *
 * Contains theme colors, category colors, and section colors
 * used throughout the application.
 */

/**
 * Section color palette for preview highlighting
 * Used in form fill page to visually distinguish different sections
 */
export const SECTION_COLORS = [
  { bg: "#FEF3C7", text: "#92400E" }, // 0: yellow
  { bg: "#DBEAFE", text: "#1E40AF" }, // 1: blue
  { bg: "#FCE7F3", text: "#9D174D" }, // 2: pink
  { bg: "#D1FAE5", text: "#065F46" }, // 3: green
  { bg: "#E0E7FF", text: "#3730A3" }, // 4: purple
  { bg: "#FEE2E2", text: "#991B1B" }, // 5: red
  { bg: "#F3F4F6", text: "#374151" }, // 6: gray
  { bg: "#CFFAFE", text: "#155E75" }, // 7: cyan
] as const;

export type SectionColor = typeof SECTION_COLORS[number];

/**
 * Category colors for template headers
 * Maps document categories to their respective header background colors
 */
export const CATEGORY_COLORS: Record<string, string> = {
  government: "#b91c1c", // red-700
  legal: "#1d4ed8", // blue-700
  finance: "#047857", // emerald-700
  education: "#7c3aed", // violet-600
  hr: "#c2410c", // orange-700
  business: "#0f766e", // teal-700
  identification: "#be185d", // pink-700
  certificate: "#4338ca", // indigo-700
  other: "#374151", // gray-700
} as const;

/**
 * Default color for categories not in the map
 */
export const DEFAULT_CATEGORY_COLOR = "#007398"; // ScienceDirect blue

/**
 * Get header background color based on category
 *
 * @param category - The document category
 * @returns The corresponding hex color code
 */
export function getHeaderBgColor(category: string): string {
  return CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLOR;
}

/**
 * Get section color by index (wraps around)
 *
 * @param index - The section index
 * @returns The color object with bg and text properties
 */
export function getSectionColor(index: number): SectionColor {
  return SECTION_COLORS[index % SECTION_COLORS.length];
}

/**
 * Primary brand colors
 */
export const BRAND_COLORS = {
  primary: "#007398",
  primaryDark: "#005a75",
  primaryLight: "#0095c4",
  accent: "#0b4db7",
  accentDark: "#000091",
  accentLight: "#3d7de5",
} as const;

/**
 * UI state colors
 */
export const STATE_COLORS = {
  success: "#047857",
  successLight: "#d1fae5",
  warning: "#c2410c",
  warningLight: "#ffedd5",
  error: "#b91c1c",
  errorLight: "#fee2e2",
  info: "#0369a1",
  infoLight: "#e0f2fe",
} as const;

/**
 * Neutral colors
 */
export const NEUTRAL_COLORS = {
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
  black: "#000000",
} as const;

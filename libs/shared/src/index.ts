// API
export { ApiClient, apiClient } from './api/client';
export type { OCRResponse } from './api/client';
export { addressService, AddressService } from './api/addressService';
export type { AdministrativeBoundary, AddressSelection } from './api/addressService';
export * from './api/types';

// Auth
export { AuthProvider, AuthContext } from './auth/context';
export { useAuth, useIsAdmin, useQuota } from './auth/hooks';
export type * from './auth/types';

// Constants
export {
  SECTION_COLORS,
  CATEGORY_COLORS,
  DEFAULT_CATEGORY_COLOR,
  BRAND_COLORS,
  STATE_COLORS,
  NEUTRAL_COLORS,
  getHeaderBgColor,
  getSectionColor,
} from './constants/colors';
export type { SectionColor } from './constants/colors';

// Firebase
export { app as firebaseApp, auth, googleProvider } from './firebase/config';

// Utils
export {
  handleApiError,
  parseError,
  safeAsync,
  createError,
} from './utils/errorHandler';
export type { ErrorResponse } from './utils/errorHandler';

export {
  DATE_FORMAT_OPTIONS,
  ENTITY_LABELS,
  GROUP_LABELS,
  formatDateToDisplay,
  parseDateToISO,
  getDatePlaceholder,
  detectFieldType,
  generateFieldDefinitions,
  getGroupLabel,
  groupFieldsByEntity,
  groupFieldsBySavedGroup,
  groupFieldsByGroup,
  groupFieldsByEntityAndGroup,
  detectMergeableGroups,
  createMergedFieldDefinition,
  splitMergedValue,
  joinMergedValues,
  validateField,
  createRadioGroupDefinition,
  expandRadioGroupValue,
  getRadioGroupSelectedValue,
  detectPotentialRadioGroups,
} from './utils/fieldTypes';
export type { GroupedSection, FieldGroup, EntityWithGroups } from './utils/fieldTypes';

export { logger } from './utils/logger';
export type { LogLevel, LoggerConfig } from './utils/logger';

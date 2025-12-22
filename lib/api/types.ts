// API Types for Placeholder-Model Backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Enum Types
export type Category = 'frequently_used' | string;

export type TemplateType = 'official' | 'private' | 'community';

export type Tier = 'free' | 'basic' | 'premium' | 'enterprise';

// Field Definition Types (from backend auto-detection)
export type DataType =
  | 'text'
  | 'id_number'
  | 'date'
  | 'time'
  | 'number'
  | 'address'
  | 'province'
  | 'district'
  | 'subdistrict'
  | 'country'
  | 'name_prefix'
  | 'name'
  | 'weekday'
  | 'phone'
  | 'email'
  | 'house_code'
  | 'zodiac'
  | 'lunar_month'
  | 'officer_name';

export type Entity =
  | 'child'
  | 'mother'
  | 'father'
  | 'informant'
  | 'registrar'
  | 'general';

export type InputType = 'text' | 'select' | 'date' | 'time' | 'number' | 'textarea' | 'checkbox' | 'merged' | 'radio' | 'location' | 'digit';

// Digit format pattern - defines the structure of digit blocks
// Format: Use 'X' for digit, 'A' for letter, '-' or other chars as separators
// Examples: "XX-X-XXX-XXXX" for license plate, "XXX-XXX" for OTP
export type DigitFormat = string;

// Location output format - determines which administrative boundary fields are returned
export type LocationOutputFormat =
  | 'province'           // name_eng1 only (Province)
  | 'district'           // name_eng2 only (District)
  | 'subdistrict'        // name_eng3 only (Sub-district)
  | 'all_english'        // name_eng1 + name_eng2 + name_eng3 (Province, District, Sub-district)
  | 'province_district'  // name_eng1 + name_eng2 (Province, District)
  | 'district_subdistrict'; // name_eng2 + name_eng3 (District, Sub-district)

// Page orientation type
export type PageOrientation = 'portrait' | 'landscape';

// Radio option for radio group input type
export interface RadioOption {
  placeholder: string;   // The placeholder key (e.g., "$1", "$2")
  label: string;         // Display label (e.g., "ชาย / Male")
  value: string;         // Value when selected (typically "/" for checkmarks)
  childFields?: string[]; // Child fields to show when this option is selected (e.g., ["$3_D"])
}

export interface FieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
  required?: boolean;
}

// Date format type for display formatting
export type DateFormat = 'yyyy/mm/dd' | 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'dd MMM yyyy';

export interface FieldDefinition {
  placeholder: string;
  dataType: DataType;
  entity: Entity;
  inputType: InputType;
  validation?: FieldValidation;
  label?: string;
  description?: string;
  group?: string;      // Group name for related fields (e.g., "dollar_numbers", "4d_codes")
  groupOrder?: number; // Order within the group
  order?: number;      // Global display order for the field (user can reorder)
  defaultValue?: string; // Default value for the field (e.g., "/" for checkbox)
  dateFormat?: DateFormat; // Date display format (for date fields)
  // Merged field properties
  isMerged?: boolean;           // Whether this is a merged field
  mergedFields?: string[];      // List of original placeholder keys that are merged
  separator?: string;           // Separator to use when splitting the merged value (default: "")
  mergePattern?: string;        // Pattern used to detect merge (e.g., "$1-$13")

  // Radio group properties (for mutually exclusive checkbox groups like Male/Female)
  isRadioGroup?: boolean;       // Whether this field is a radio group master
  radioGroupId?: string;        // Unique identifier for the radio group
  radioOptions?: RadioOption[]; // List of radio options with their placeholders

  // Location input properties (for Thai administrative boundary selection)
  locationOutputFormat?: LocationOutputFormat; // Which fields to output (province, district, subdistrict, all_english, etc.)

  // Digit input properties (for OTP, license plates, ID segments, etc.)
  digitFormat?: DigitFormat; // Pattern like "XX-X-XXX-XXXX" where X=digit, A=letter, others are separators
}

// Detected mergeable group from placeholders
export interface MergeableGroup {
  pattern: string;           // e.g., "$1-$13" or "n1-n5"
  prefix: string;            // e.g., "$" or "n"
  startNum: number;          // e.g., 1
  endNum: number;            // e.g., 13
  fields: string[];          // All field keys in order
  suggestedLabel: string;    // e.g., "เลข 13 หลัก ($1-$13)"
  suggestedSeparator: string; // e.g., "" for ID numbers, "-" for dates
}

export interface FieldDefinitionsResponse {
  field_definitions: Record<string, FieldDefinition>;
}

// Document Type Categories (for grouping related templates)
export type DocumentTypeCategory =
  | 'identification'
  | 'certificate'
  | 'contract'
  | 'application'
  | 'financial'
  | 'government'
  | 'education'
  | 'medical'
  | 'other';

// Document Type (groups related templates together, e.g., "บัตรประชาชน" has 3 templates)
export interface DocumentType {
  id: string;
  code: string;           // Unique code (e.g., "thai_id_card")
  name: string;           // Thai name (e.g., "บัตรประชาชน")
  name_en: string;        // English name (e.g., "Thai ID Card")
  description: string;
  original_source: string; // Source/origin of the document type
  category: string;       // Category (can be custom, not limited to predefined types)
  icon: string;           // Icon name for UI
  color: string;          // Color code (e.g., "#FF5733")
  sort_order: number;
  is_active: boolean;
  metadata: string;       // JSON for additional data
  created_at: string;
  updated_at: string;
  templates?: Template[]; // Templates belonging to this document type
}

export interface DocumentTypesResponse {
  document_types: DocumentType[];
}

export interface DocumentTypeCreateRequest {
  code: string;
  name: string;
  name_en?: string;
  description?: string;
  original_source?: string;
  category?: string;  // Allow custom categories (not limited to DocumentTypeCategory enum)
  icon?: string;
  color?: string;
  sort_order?: number;
  metadata?: string;
}

export interface DocumentTypeUpdateRequest {
  code?: string;
  name?: string;
  name_en?: string;
  description?: string;
  original_source?: string;
  category?: string;  // Allow custom categories (not limited to DocumentTypeCategory enum)
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  metadata?: string;
}

export interface TemplateAssignment {
  template_id: string;
  variant_name: string;
  variant_order: number;
}

export interface BulkAssignTemplatesRequest {
  assignments: TemplateAssignment[];
}

export interface GroupedTemplatesResponse {
  document_types: DocumentType[];
  orphan_templates: Template[];
}

// Auto-suggestion types for template grouping
export interface SuggestedTemplate {
  id: string;
  display_name: string;
  filename: string;
  suggested_variant: string;
  variant_order: number;
}

export interface SuggestedGroup {
  suggested_name: string;
  suggested_code: string;
  suggested_category: string;
  templates: SuggestedTemplate[];
  confidence: number;
  existing_type_id: string;
  existing_type_name: string;
}

export interface SuggestionsResponse {
  suggestions: SuggestedGroup[];
}

// Template Types (Clean API format)
export interface Template {
  id: string;
  name: string;              // Best display name (display_name > name > original_name)
  description: string;
  author: string;
  category: Category;

  // Classification
  type: TemplateType;
  tier: Tier;
  is_verified: boolean;
  is_ai_available: boolean;

  // Parsed template data (proper objects, not JSON strings)
  placeholders: string[];                        // Array of placeholder strings
  aliases: Record<string, string>;               // Map of placeholder to alias
  field_definitions: Record<string, FieldDefinition>; // Map of placeholder to field definition

  // Additional metadata (for editing/display)
  original_source?: string;
  remarks?: string;
  group?: string;
  file_size?: number;

  // Document Type grouping
  document_type_id?: string;
  variant_name?: string;      // Name of variant (e.g., "ด้านหน้า", "ด้านหลัง")
  variant_order?: number;     // Display order within document type
  document_type?: DocumentType; // Populated when include_document_type=true

  // Page orientation (detected from DOCX)
  page_orientation?: PageOrientation;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Document Types
export interface Document {
  id: string;
  template_id: string;
  filename: string;
  gcs_path_docx: string;
  gcs_path_pdf: string;
  file_size: number;
  mime_type: string;
  data: string; // JSON object of placeholder values
  status: string;
  created_at: string;
  updated_at: string;
}

// Response Types
export interface UploadResponse {
  message: string;
  template: Template;
}

export interface TemplatesResponse {
  templates: Template[];
}

export interface PlaceholdersResponse {
  placeholders: string[];
  template_id: string;
}

export interface ProcessResponse {
  message: string;
  document_id: string;
  download_url: string;
  download_pdf_url?: string;  // Only present if PDF was generated successfully
}

export interface ActivityLog {
  id: string;
  method: string;
  path: string;
  user_agent: string;
  ip_address: string;
  request_body: string;
  query_params: string;
  status_code: number;
  response_time: number;
  user_id?: string;
  user_email?: string;
  created_at: string;
}

export interface ActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
}

export interface LogStatsResponse {
  total_requests: number;
  methods: Record<string, number>;
  paths: Record<string, number>;
  status_codes: Record<string, number>;
  avg_response_time: number;
}

export interface ProcessLog {
  id: string;
  template_id: string;
  template_name: string;
  document_id: string;
  user_id?: string;
  user_email?: string;
  status: string;
  created_at: string;
}

export interface ProcessLogsResponse {
  logs: ProcessLog[];
  total: number;
  page: number;
  limit: number;
}

export interface HistoryResponse {
  documents: Document[];
}

// Update Request Types
export interface TemplateUpdateData {
  displayName: string;
  name?: string;
  description: string;
  author: string;
  category?: string;
  originalSource?: string;
  remarks?: string;
  isVerified?: boolean;
  isAIAvailable?: boolean;
  type?: TemplateType;
  tier?: Tier;
  group?: string;
  aliases?: Record<string, string>;
}

// Field Rule Types
export interface FieldRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  priority: number;
  is_active: boolean;
  data_type: string;
  input_type: string;
  entity: string;
  group_name: string;
  validation: string;
  options: string;
  created_at: string;
  updated_at: string;
}

export interface FieldRulesResponse {
  rules: FieldRule[];
  total: number;
}

export interface FieldRuleCreateRequest {
  name: string;
  description?: string;
  pattern: string;
  priority?: number;
  is_active?: boolean;
  data_type?: string;
  input_type?: string;
  entity?: string;
  group_name?: string;
  validation?: string;
  options?: string;
}

// Entity Rule Types
export interface EntityRule {
  id: string;
  name: string;
  code: string;
  description: string;
  pattern: string;
  priority: number;
  is_active: boolean;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface EntityRulesResponse {
  rules: EntityRule[];
  total: number;
}

export interface EntityRuleCreateRequest {
  name: string;
  code: string;
  description?: string;
  pattern: string;
  priority?: number;
  is_active?: boolean;
  color?: string;
  icon?: string;
}

export interface DataTypeOption {
  value: string;
  label: string;
}

export interface InputTypeOption {
  value: string;
  label: string;
}

// Configurable Data Type (from database)
export interface ConfigurableDataType {
  id: string;
  code: string;
  name: string;
  description: string;
  pattern: string;  // Regex pattern for auto-detection
  input_type: string;
  validation: string;
  options: string;
  default_value: string;  // Default input value
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DataTypesResponse {
  data_types: ConfigurableDataType[];
  total: number;
}

export interface DataTypeCreateRequest {
  code: string;
  name: string;
  description?: string;
  pattern?: string;  // Regex pattern for auto-detection
  input_type?: string;
  validation?: string;
  options?: string;
  default_value?: string;  // Default input value
  priority?: number;
  is_active?: boolean;
}

// Configurable Input Type (from database)
export interface ConfigurableInputType {
  id: string;
  code: string;
  name: string;
  description: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InputTypesResponse {
  input_types: ConfigurableInputType[];
  total: number;
}

export interface InputTypeCreateRequest {
  code: string;
  name: string;
  description?: string;
  priority?: number;
  is_active?: boolean;
}

// Statistics Types
export interface StatisticsSummary {
  total_form_submits: number;
  total_exports: number;
  total_downloads: number;
}

export interface TemplateStatistics {
  template_id: string;
  template_name: string;
  form_submits: number;
  exports: number;
  downloads: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface TimeSeriesData {
  event_type: string;
  data_points: TimeSeriesPoint[];
  total: number;
}

export interface StatisticsResponse {
  summary: StatisticsSummary;
  templates: TemplateStatistics[];
  trends: Record<string, TimeSeriesData>;
}

export interface StatsSummaryResponse {
  summary: StatisticsSummary;
}

export interface StatsTemplatesResponse {
  templates: TemplateStatistics[];
}

export interface StatsTrendsResponse {
  days: number;
  trends: Record<string, TimeSeriesData>;
}

export interface StatsTimeSeriesResponse {
  days: number;
  data: TimeSeriesData;
}

// AI Alias Suggestion Types
export interface AliasSuggestion {
  placeholder: string;
  suggested_alias: string;
  confidence: number;
  reasoning: string;
}

export interface AliasSuggestionResponse {
  suggestions: AliasSuggestion[];
  model: string;
  provider: string;
  message: string;
}

// AI Field Type Suggestion Types
export interface FieldTypeSuggestion {
  placeholder: string;
  suggested_alias: string;
  data_type: DataType;
  input_type: InputType;
  entity: Entity;
  confidence: number;
  reasoning: string;
}

export interface FieldTypeSuggestionResponse {
  suggestions: FieldTypeSuggestion[];
  model: string;
  provider: string;
  message: string;
}

// Filter Types
export interface FilterOption {
  id: string;
  filter_category_id: string;
  value: string;
  label: string;
  label_en?: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
  count?: number; // Only present in GetFiltersWithCounts response
}

export interface FilterCategory {
  id: string;
  code: string;
  name: string;
  name_en?: string;
  description?: string;
  field_name: string;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
  options?: FilterOption[];
}

export interface FilterCategoryCreateRequest {
  code: string;
  name: string;
  name_en?: string;
  description?: string;
  field_name: string;
  sort_order?: number;
}

export interface FilterCategoryUpdateRequest {
  name?: string;
  name_en?: string;
  description?: string;
  field_name?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface FilterOptionCreateRequest {
  filter_category_id: string;
  value: string;
  label: string;
  label_en?: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
  is_default?: boolean;
}

export interface FilterOptionUpdateRequest {
  value?: string;
  label?: string;
  label_en?: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

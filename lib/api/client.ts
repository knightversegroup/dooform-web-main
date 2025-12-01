// API Client for Placeholder-Model Backend
import {
  API_BASE_URL,
  UploadResponse,
  TemplatesResponse,
  PlaceholdersResponse,
  ProcessResponse,
  ActivityLogsResponse,
  LogStatsResponse,
  ProcessLogsResponse,
  HistoryResponse,
  Template,
  TemplateType,
  Tier,
  TemplateUpdateData,
  FieldDefinition,
  FieldDefinitionsResponse,
  FieldRule,
  FieldRulesResponse,
  FieldRuleCreateRequest,
  DataTypeOption,
  InputTypeOption,
  EntityRule,
  EntityRulesResponse,
  EntityRuleCreateRequest,
  ConfigurableDataType,
  DataTypesResponse,
  DataTypeCreateRequest,
  ConfigurableInputType,
  InputTypesResponse,
  InputTypeCreateRequest,
} from './types';

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Generic HTTP methods
  async get<T = unknown>(url: string, config?: { params?: Record<string, unknown> }): Promise<{ data: T }> {
    let fullUrl = `${this.baseUrl.replace('/api/v1', '')}${url}`;

    if (config?.params) {
      const params = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });
    const data = await this.handleResponse<T>(response);
    return { data };
  }

  async post<T = unknown>(url: string, body?: unknown, config?: { headers?: HeadersInit }): Promise<{ data: T }> {
    const isFormData = body instanceof FormData;
    const headers: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...this.getAuthHeaders(),
      ...config?.headers,
    };

    const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}${url}`, {
      method: 'POST',
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });
    const data = await this.handleResponse<T>(response);
    return { data };
  }

  async put<T = unknown>(url: string, body?: unknown): Promise<{ data: T }> {
    const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });
    const data = await this.handleResponse<T>(response);
    return { data };
  }

  async delete<T = unknown>(url: string): Promise<{ data: T }> {
    const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });
    const data = await this.handleResponse<T>(response);
    return { data };
  }

  // Template Endpoints

  async uploadTemplate(
    file: File,
    fileName: string,
    description: string,
    author: string,
    aliases?: Record<string, string>,
    htmlFile?: File
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('template', file);
    formData.append('fileName', fileName);
    formData.append('description', description);
    formData.append('author', author);

    if (aliases && Object.keys(aliases).length > 0) {
      formData.append('aliases', JSON.stringify(aliases));
    }

    if (htmlFile) {
      formData.append('htmlPreview', htmlFile);
    }

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    return this.handleResponse<UploadResponse>(response);
  }

  async getHTMLPreview(templateId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}/preview`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch HTML preview: ${response.statusText}`);
    }
    return response.text();
  }

  async getAllTemplates(): Promise<TemplatesResponse> {
    const response = await fetch(`${this.baseUrl}/templates`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<TemplatesResponse>(response);
  }

  async getTemplate(templateId: string): Promise<Template> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Template>(response);
  }

  async getPlaceholders(templateId: string): Promise<PlaceholdersResponse> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}/placeholders`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<PlaceholdersResponse>(response);
  }

  // Field Definitions (auto-detected from placeholders)

  async getFieldDefinitions(templateId: string): Promise<Record<string, FieldDefinition>> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}/field-definitions`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<FieldDefinitionsResponse>(response);
    return result.field_definitions;
  }

  async updateFieldDefinitions(
    templateId: string,
    fieldDefinitions: Record<string, FieldDefinition>
  ): Promise<{ message: string; template: Template }> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}/field-definitions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ field_definitions: fieldDefinitions }),
    });
    return this.handleResponse<{ message: string; template: Template }>(response);
  }

  async regenerateFieldDefinitions(templateId: string): Promise<Record<string, FieldDefinition>> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}/field-definitions/regenerate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ message: string; field_definitions: Record<string, FieldDefinition> }>(response);
    return result.field_definitions;
  }

  // Document Processing

  async processDocument(templateId: string, data: Record<string, string>, organizationId?: string): Promise<ProcessResponse> {
    const body: Record<string, unknown> = { data };
    if (organizationId) {
      body.organization_id = organizationId;
    }

    const response = await fetch(`${this.baseUrl}/templates/${templateId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    return this.handleResponse<ProcessResponse>(response);
  }

  getDownloadUrl(documentId: string, format: 'docx' | 'pdf' = 'docx'): string {
    const url = `${this.baseUrl}/documents/${documentId}/download`;
    return format === 'pdf' ? `${url}?format=pdf` : url;
  }

  async downloadDocument(documentId: string, format: 'docx' | 'pdf' = 'docx'): Promise<Blob> {
    const response = await fetch(this.getDownloadUrl(documentId, format), {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    return response.blob();
  }

  // Activity Logs

  async getActivityLogs(
    limit = 50,
    page = 1,
    method?: string,
    path?: string
  ): Promise<ActivityLogsResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
    });
    if (method) params.append('method', method);
    if (path) params.append('path', path);

    const response = await fetch(`${this.baseUrl}/logs?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ActivityLogsResponse>(response);
  }

  async getLogStats(): Promise<LogStatsResponse> {
    const response = await fetch(`${this.baseUrl}/logs/stats`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<LogStatsResponse>(response);
  }

  async getProcessLogs(limit = 50, page = 1): Promise<ProcessLogsResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
    });

    const response = await fetch(`${this.baseUrl}/logs/process?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ProcessLogsResponse>(response);
  }

  async getHistory(): Promise<HistoryResponse> {
    const response = await fetch(`${this.baseUrl}/history`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<HistoryResponse>(response);
  }

  async updateTemplate(
    templateId: string,
    data: TemplateUpdateData,
    htmlFile?: File
  ): Promise<{ message: string; template: Template }> {
    if (htmlFile) {
      const formData = new FormData();
      formData.append('displayName', data.displayName);
      formData.append('description', data.description);
      formData.append('author', data.author);

      if (data.name) formData.append('name', data.name);
      if (data.category) formData.append('category', data.category);
      if (data.originalSource) formData.append('original_source', data.originalSource);
      if (data.remarks) formData.append('remarks', data.remarks);
      if (data.isVerified !== undefined) formData.append('is_verified', String(data.isVerified));
      if (data.isAIAvailable !== undefined) formData.append('is_ai_available', String(data.isAIAvailable));
      if (data.type) formData.append('type', data.type);
      if (data.tier) formData.append('tier', data.tier);
      if (data.group) formData.append('group', data.group);

      if (data.aliases && Object.keys(data.aliases).length > 0) {
        formData.append('aliases', JSON.stringify(data.aliases));
      }

      formData.append('htmlPreview', htmlFile);

      const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: formData,
      });

      return this.handleResponse<{ message: string; template: Template }>(response);
    } else {
      const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          display_name: data.displayName,
          name: data.name || '',
          description: data.description,
          author: data.author,
          category: data.category || '',
          original_source: data.originalSource || '',
          remarks: data.remarks || '',
          is_verified: data.isVerified,
          is_ai_available: data.isAIAvailable,
          type: data.type || '',
          tier: data.tier || '',
          group: data.group || '',
          aliases: data.aliases || {},
        }),
      });

      return this.handleResponse<{ message: string; template: Template }>(response);
    }
  }

  async deleteTemplate(templateId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{ message: string }>(response);
  }

  // Health Check

  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}/health`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ status: string; timestamp: string; version: string }>(response);
  }

  // Field Rules

  async getFieldRules(includeInactive = false): Promise<FieldRule[]> {
    const params = includeInactive ? '?include_inactive=true' : '';
    const response = await fetch(`${this.baseUrl}/field-rules${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<FieldRulesResponse>(response);
    return result.rules;
  }

  async getFieldRule(ruleId: string): Promise<FieldRule> {
    const response = await fetch(`${this.baseUrl}/field-rules/${ruleId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<FieldRule>(response);
  }

  async createFieldRule(rule: FieldRuleCreateRequest): Promise<{ message: string; rule: FieldRule }> {
    const response = await fetch(`${this.baseUrl}/field-rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(rule),
    });
    return this.handleResponse<{ message: string; rule: FieldRule }>(response);
  }

  async updateFieldRule(ruleId: string, rule: Partial<FieldRuleCreateRequest> & { is_active?: boolean }): Promise<{ message: string; rule: FieldRule }> {
    const response = await fetch(`${this.baseUrl}/field-rules/${ruleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(rule),
    });
    return this.handleResponse<{ message: string; rule: FieldRule }>(response);
  }

  async deleteFieldRule(ruleId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/field-rules/${ruleId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async testFieldRule(pattern: string, placeholders: string[]): Promise<{ pattern: string; results: Record<string, boolean> }> {
    const response = await fetch(`${this.baseUrl}/field-rules/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ pattern, placeholders }),
    });
    return this.handleResponse<{ pattern: string; results: Record<string, boolean> }>(response);
  }

  async initializeDefaultFieldRules(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/field-rules/initialize`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async getDataTypes(): Promise<DataTypeOption[]> {
    const response = await fetch(`${this.baseUrl}/field-rules/data-types`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ data_types: DataTypeOption[] }>(response);
    return result.data_types;
  }

  async getInputTypes(): Promise<InputTypeOption[]> {
    const response = await fetch(`${this.baseUrl}/field-rules/input-types`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ input_types: InputTypeOption[] }>(response);
    return result.input_types;
  }

  // Entity Rules

  async getEntityRules(includeInactive = false): Promise<EntityRule[]> {
    const params = includeInactive ? '?include_inactive=true' : '';
    const response = await fetch(`${this.baseUrl}/entity-rules${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<EntityRulesResponse>(response);
    return result.rules;
  }

  async getEntityRule(ruleId: string): Promise<EntityRule> {
    const response = await fetch(`${this.baseUrl}/entity-rules/${ruleId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<EntityRule>(response);
  }

  async createEntityRule(rule: EntityRuleCreateRequest): Promise<{ message: string; rule: EntityRule }> {
    const response = await fetch(`${this.baseUrl}/entity-rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(rule),
    });
    return this.handleResponse<{ message: string; rule: EntityRule }>(response);
  }

  async updateEntityRule(ruleId: string, rule: Partial<EntityRuleCreateRequest> & { is_active?: boolean }): Promise<{ message: string; rule: EntityRule }> {
    const response = await fetch(`${this.baseUrl}/entity-rules/${ruleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(rule),
    });
    return this.handleResponse<{ message: string; rule: EntityRule }>(response);
  }

  async deleteEntityRule(ruleId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/entity-rules/${ruleId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async initializeDefaultEntityRules(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/entity-rules/initialize`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async getEntityLabels(): Promise<Record<string, string>> {
    const response = await fetch(`${this.baseUrl}/entity-rules/labels`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ labels: Record<string, string> }>(response);
    return result.labels;
  }

  async getEntityColors(): Promise<Record<string, string>> {
    const response = await fetch(`${this.baseUrl}/entity-rules/colors`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{ colors: Record<string, string> }>(response);
    return result.colors;
  }

  // =====================
  // Configurable Data Types
  // =====================

  async getConfigurableDataTypes(activeOnly = false): Promise<ConfigurableDataType[]> {
    const params = activeOnly ? '?active=true' : '';
    const response = await fetch(`${this.baseUrl}/data-types${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<DataTypesResponse>(response);
    return result.data_types || [];
  }

  async getConfigurableDataType(id: string): Promise<ConfigurableDataType> {
    const response = await fetch(`${this.baseUrl}/data-types/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ConfigurableDataType>(response);
  }

  async createConfigurableDataType(data: DataTypeCreateRequest): Promise<ConfigurableDataType> {
    const response = await fetch(`${this.baseUrl}/data-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<ConfigurableDataType>(response);
  }

  async updateConfigurableDataType(id: string, data: Partial<DataTypeCreateRequest>): Promise<ConfigurableDataType> {
    const response = await fetch(`${this.baseUrl}/data-types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<ConfigurableDataType>(response);
  }

  async deleteConfigurableDataType(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/data-types/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async initializeDefaultDataTypes(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/data-types/initialize`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  // =====================
  // Configurable Input Types
  // =====================

  async getConfigurableInputTypes(activeOnly = false): Promise<ConfigurableInputType[]> {
    const params = activeOnly ? '?active=true' : '';
    const response = await fetch(`${this.baseUrl}/input-types${params}`, {
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<InputTypesResponse>(response);
    return result.input_types || [];
  }

  async getConfigurableInputType(id: string): Promise<ConfigurableInputType> {
    const response = await fetch(`${this.baseUrl}/input-types/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ConfigurableInputType>(response);
  }

  async createConfigurableInputType(data: InputTypeCreateRequest): Promise<ConfigurableInputType> {
    const response = await fetch(`${this.baseUrl}/input-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<ConfigurableInputType>(response);
  }

  async updateConfigurableInputType(id: string, data: Partial<InputTypeCreateRequest>): Promise<ConfigurableInputType> {
    const response = await fetch(`${this.baseUrl}/input-types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<ConfigurableInputType>(response);
  }

  async deleteConfigurableInputType(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/input-types/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async initializeDefaultInputTypes(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/input-types/initialize`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  // OCR Methods

  async extractTextFromImage(imageFile: File, templateId?: string): Promise<OCRResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (templateId) {
      formData.append('template_id', templateId);
    }

    const response = await fetch(`${this.baseUrl}/ocr/extract`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });
    return this.handleResponse<OCRResponse>(response);
  }

  async extractTextForTemplate(templateId: string, imageFile: File): Promise<OCRResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/templates/${templateId}/ocr`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });
    return this.handleResponse<OCRResponse>(response);
  }
}

// OCR Response type
export interface OCRResponse {
  raw_text: string;
  extracted_data: Record<string, string>;
  mapped_fields?: Record<string, string>;
  detection_score: number;
  message: string;
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export helper functions for coordinate conversion
export const pointsToPixels = (points: number, dpi = 96): number => {
  return points * (dpi / 72.0);
};

export const pixelsToPoints = (pixels: number, dpi = 96): number => {
  return pixels / (dpi / 72.0);
};

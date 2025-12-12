// Address Autofill Service

const ADDRESS_API_BASE = process.env.NEXT_PUBLIC_ADDRESS_API_URL;

// Types for Thai address data based on administrative_boundaries table
// API returns UPPERCASE fields, we normalize to lowercase
export interface AdministrativeBoundary {
  objectid: number;
  admin_id1: string;      // Province ID
  admin_id2: string;      // District ID
  admin_id3: string;      // Sub-district ID
  name1: string;          // Province (Thai)
  name_eng1: string;      // Province (English)
  name2: string;          // District (Thai)
  name_eng2: string;      // District (English)
  name3: string;          // Sub-district (Thai)
  name_eng3: string;      // Sub-district (English)
  type: number;
  population?: number;
  male?: number;
  female?: number;
  house?: number;
}

// Raw API response with uppercase fields
interface RawAdministrativeBoundary {
  OBJECTID: number;
  ADMIN_ID1: string;
  ADMIN_ID2: string;
  ADMIN_ID3: string;
  NAME1: string;
  NAME_ENG1: string;
  NAME2: string;
  NAME_ENG2: string;
  NAME3: string;
  NAME_ENG3: string;
  Type: number;
  POPULATION?: number;
  MALE?: number;
  FEMALE?: number;
  HOUSE?: number;
}

// Normalize API response to lowercase fields
function normalizeResult(raw: RawAdministrativeBoundary): AdministrativeBoundary {
  return {
    objectid: raw.OBJECTID,
    admin_id1: raw.ADMIN_ID1,
    admin_id2: raw.ADMIN_ID2,
    admin_id3: raw.ADMIN_ID3,
    name1: raw.NAME1,
    name_eng1: raw.NAME_ENG1,
    name2: raw.NAME2,
    name_eng2: raw.NAME_ENG2,
    name3: raw.NAME3,
    name_eng3: raw.NAME_ENG3,
    type: raw.Type,
    population: raw.POPULATION,
    male: raw.MALE,
    female: raw.FEMALE,
    house: raw.HOUSE,
  };
}

export interface AddressSelection {
  province: string;
  provinceEn: string;
  district: string;
  districtEn: string;
  subDistrict: string;
  subDistrictEn: string;
  fullAddress: string;
  fullAddressEn: string;
}

class AddressService {
  private cache: Map<string, AdministrativeBoundary[]> = new Map();
  private provincesCache: string[] | null = null;

  // Search address by keyword (autocomplete)
  async searchAddress(keyword: string): Promise<AdministrativeBoundary[]> {
    if (!ADDRESS_API_BASE || !keyword || keyword.length < 1) {
      return [];
    }

    const cacheKey = `search:${keyword}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`${ADDRESS_API_BASE}/search?q=${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const rawData: RawAdministrativeBoundary[] = await response.json();
      const data = rawData.map(normalizeResult);
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Address search error:', error);
      return [];
    }
  }

  // Query by province, district, sub-district
  async queryAddress(params: { name1?: string; name2?: string; name3?: string }): Promise<AdministrativeBoundary[]> {
    if (!ADDRESS_API_BASE) {
      return [];
    }

    const queryParams = new URLSearchParams();
    if (params.name1) queryParams.append('name1', params.name1);
    if (params.name2) queryParams.append('name2', params.name2);
    if (params.name3) queryParams.append('name3', params.name3);

    const cacheKey = `query:${queryParams.toString()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`${ADDRESS_API_BASE}/query?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const rawData: RawAdministrativeBoundary[] = await response.json();
      const data = rawData.map(normalizeResult);
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Address query error:', error);
      return [];
    }
  }

  // Get unique provinces
  async getProvinces(): Promise<string[]> {
    if (!ADDRESS_API_BASE) {
      return [];
    }

    if (this.provincesCache) {
      return this.provincesCache;
    }

    try {
      const response = await fetch(`${ADDRESS_API_BASE}/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const rawData: RawAdministrativeBoundary[] = await response.json();
      const data = rawData.map(normalizeResult);
      const provinces = [...new Set(data.map(d => d.name1))].sort();
      this.provincesCache = provinces;
      return provinces;
    } catch (error) {
      console.error('Get provinces error:', error);
      return [];
    }
  }

  // Get districts by province
  async getDistricts(province: string): Promise<string[]> {
    const data = await this.queryAddress({ name1: province });
    return [...new Set(data.map(d => d.name2))].sort();
  }

  // Get sub-districts by province and district
  async getSubDistricts(province: string, district: string): Promise<string[]> {
    const data = await this.queryAddress({ name1: province, name2: district });
    return [...new Set(data.map(d => d.name3))].sort();
  }

  // Convert boundary to selection format
  toAddressSelection(boundary: AdministrativeBoundary): AddressSelection {
    return {
      province: boundary.name1,
      provinceEn: boundary.name_eng1,
      district: boundary.name2,
      districtEn: boundary.name_eng2,
      subDistrict: boundary.name3,
      subDistrictEn: boundary.name_eng3,
      fullAddress: `${boundary.name3} ${boundary.name2} ${boundary.name1}`,
      fullAddressEn: `${boundary.name_eng3}, ${boundary.name_eng2}, ${boundary.name_eng1}`,
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    this.provincesCache = null;
  }
}

export const addressService = new AddressService();

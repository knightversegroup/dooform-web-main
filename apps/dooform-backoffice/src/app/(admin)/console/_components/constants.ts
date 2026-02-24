import { Database, Filter, FileType } from "lucide-react";

// Tab types
export type ConsoleTab = "datatypes" | "filters" | "doctypes";

// Available input types for data types
export const INPUT_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'select', label: 'Select' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'location', label: 'Location (Thai Admin Boundary)' },
  { value: 'digit', label: 'Digit Blocks (OTP, License Plate)' },
];

// Location output format options (Sub-district -> District -> Province order)
export const LOCATION_OUTPUT_FORMAT_OPTIONS = [
  { value: 'subdistrict', label: 'Sub-district only', description: 'name_eng3 Sub-district' },
  { value: 'district', label: 'District only', description: 'name_eng2 District' },
  { value: 'province', label: 'Province only', description: 'name_eng1 Province' },
  { value: 'district_subdistrict', label: 'Sub-district + District', description: 'name_eng3 Sub-district, name_eng2 District' },
  { value: 'province_district', label: 'District + Province', description: 'name_eng2 District, name_eng1 Province' },
  { value: 'all_english', label: 'All (Sub-district -> District -> Province)', description: 'name_eng3 Sub-district, name_eng2 District, name_eng1 Province' },
];

export interface TabConfig {
  id: ConsoleTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

export const TABS: TabConfig[] = [
  {
    id: "datatypes",
    label: "ประเภทข้อมูล",
    icon: Database,
    description: "กำหนดประเภทข้อมูลและการตรวจจับอัตโนมัติ",
  },
  {
    id: "filters",
    label: "ตัวกรอง",
    icon: Filter,
    description: "ตั้งค่าตัวกรองสำหรับค้นหาเทมเพลต",
  },
  {
    id: "doctypes",
    label: "ประเภทเอกสาร",
    icon: FileType,
    description: "จัดกลุ่มเทมเพลตตามประเภทเอกสาร",
  },
];

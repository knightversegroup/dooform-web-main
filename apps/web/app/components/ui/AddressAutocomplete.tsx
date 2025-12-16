"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { addressService, AdministrativeBoundary, AddressSelection } from "@/lib/api/addressService";

// Search level determines what data to fetch and display
export type AddressSearchLevel = 'full' | 'province' | 'district' | 'subdistrict';

// Deduplicated result item for display
interface DeduplicatedResult {
  key: string;
  displayPrimary: string;      // Main display text (Thai)
  displaySecondary: string;    // Secondary text (English or parent info)
  original: AdministrativeBoundary;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: AddressSelection) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  searchLevel?: AddressSearchLevel; // What level to search for
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder,
  disabled,
  className = "",
  searchLevel = 'full',
}: AddressAutocompleteProps) {
  // Default placeholder based on search level
  const defaultPlaceholder = {
    'full': "พิมพ์ชื่อตำบล อำเภอ หรือจังหวัด...",
    'province': "พิมพ์ชื่อจังหวัด...",
    'district': "พิมพ์ชื่ออำเภอ/เขต...",
    'subdistrict': "พิมพ์ชื่อตำบล/แขวง...",
  }[searchLevel];

  const actualPlaceholder = placeholder || defaultPlaceholder;
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<AdministrativeBoundary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Deduplicate results based on search level
  const deduplicatedResults = useMemo((): DeduplicatedResult[] => {
    if (!results.length) return [];

    const seen = new Map<string, DeduplicatedResult>();

    results.forEach((item) => {
      let key: string;
      let displayPrimary: string;
      let displaySecondary: string;

      switch (searchLevel) {
        case 'province':
          // Deduplicate by province only
          key = item.admin_id1;
          displayPrimary = item.name1;
          displaySecondary = item.name_eng1;
          break;
        case 'district':
          // Deduplicate by province + district
          key = `${item.admin_id1}-${item.admin_id2}`;
          displayPrimary = item.name2;
          displaySecondary = `${item.name_eng2} (${item.name1})`;
          break;
        case 'subdistrict':
          // Deduplicate by province + district + subdistrict
          key = `${item.admin_id1}-${item.admin_id2}-${item.admin_id3}`;
          displayPrimary = item.name3;
          displaySecondary = `${item.name_eng3} (${item.name2}, ${item.name1})`;
          break;
        case 'full':
        default:
          // No deduplication for full address
          key = `${item.objectid}`;
          displayPrimary = `${item.name3} ${item.name2} ${item.name1}`;
          displaySecondary = `${item.name_eng3}, ${item.name_eng2}, ${item.name_eng1}`;
          break;
      }

      if (!seen.has(key)) {
        seen.set(key, {
          key,
          displayPrimary,
          displaySecondary,
          original: item,
        });
      }
    });

    return Array.from(seen.values());
  }, [results, searchLevel]);

  // Debounced search
  const searchAddress = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const data = await addressService.searchAddress(query);
      // Filter out invalid results
      const validResults = (data || []).filter(
        (item) => item && item.name1 && item.name2 && item.name3
      );
      setResults(validResults);
      setIsOpen(validResults.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchAddress(newValue);
    }, 300);
  };

  // Handle selecting an address based on search level
  const handleSelect = (result: DeduplicatedResult) => {
    const boundary = result.original;
    const selection = addressService.toAddressSelection(boundary);

    // Set the input value based on search level
    let selectedValue: string;
    switch (searchLevel) {
      case 'province':
        selectedValue = boundary.name_eng1;
        break;
      case 'district':
        selectedValue = boundary.name_eng2;
        break;
      case 'subdistrict':
        selectedValue = boundary.name_eng3;
        break;
      case 'full':
      default:
        selectedValue = selection.fullAddressEn;
        break;
    }

    onChange(selectedValue);
    onAddressSelect?.(selection);
    setIsOpen(false);
    setResults([]);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || deduplicatedResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < deduplicatedResults.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < deduplicatedResults.length) {
          handleSelect(deduplicatedResults[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const clearInput = () => {
    onChange("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          <MapPin className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 1 && deduplicatedResults.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 p-2.5 text-sm text-foreground bg-background border border-border-default rounded-xl focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted disabled:opacity-50 disabled:bg-surface-alt`}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 className="w-4 h-4 text-text-muted animate-spin" />}
          {value && !loading && (
            <button
              type="button"
              onClick={clearInput}
              className="text-text-muted hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && deduplicatedResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border-default rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {deduplicatedResults.map((result, index) => (
            <button
              key={result.key}
              type="button"
              onClick={() => handleSelect(result)}
              className={`w-full px-4 py-3 text-left hover:bg-surface-alt transition-colors border-b border-border-default last:border-b-0 ${
                index === selectedIndex ? "bg-surface-alt" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {result.displaySecondary}
                  </p>
                  <p className="text-xs text-text-muted">
                    {result.displayPrimary}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && value.length >= 1 && deduplicatedResults.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border-default rounded-xl shadow-lg p-4">
          <p className="text-sm text-text-muted text-center">ไม่พบข้อมูลที่ตรงกัน</p>
        </div>
      )}
    </div>
  );
}

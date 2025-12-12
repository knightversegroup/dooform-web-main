"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { Template } from "@/lib/api/types";

interface HeroBannerProps {
  background?: "default" | "alt";
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 4C7.13401 4 4 7.13401 4 11C4 14.866 7.13401 18 11 18C14.866 18 18 14.866 18 11C18 7.13401 14.866 4 11 4ZM2 11C2 6.02944 6.02944 2 11 2C15.9706 2 20 6.02944 20 11C20 15.9706 15.9706 20 11 20C6.02944 20 2 15.9706 2 11Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.9428 15.9428C16.3333 15.5523 16.9665 15.5523 17.357 15.9428L21.707 20.2928C22.0975 20.6833 22.0975 21.3165 21.707 21.707C21.3165 22.0975 20.6833 22.0975 20.2928 21.707L15.9428 17.357C15.5523 16.9665 15.5523 16.3333 15.9428 15.9428Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function HeroBanner({
  background = "default",
}: HeroBannerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [suggestions, setSuggestions] = useState<Template[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const bgClass = background === "alt" ? "bg-surface-alt" : "bg-background";

  // Fetch templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getAllTemplates();
        setTemplates(response.templates || []);
      } catch (err) {
        console.error("Failed to load templates:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Filter templates based on search query
  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = templates.filter((template) => {
      const matchesName =
        (template.display_name || "").toLowerCase().includes(query) ||
        (template.name || "").toLowerCase().includes(query);
      const matchesDescription = (template.description || "")
        .toLowerCase()
        .includes(query);
      const matchesCategory = (template.category || "")
        .toLowerCase()
        .includes(query);
      const matchesAuthor = (template.author || "")
        .toLowerCase()
        .includes(query);

      return (
        matchesName || matchesDescription || matchesCategory || matchesAuthor
      );
    });

    setSuggestions(filtered.slice(0, 6)); // Limit to 6 suggestions
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, [searchQuery, templates]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/forms?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (template: Template) => {
    setShowSuggestions(false);
    router.push(`/forms/${template.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputFocus = () => {
    if (searchQuery.trim().length >= 1 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Popular search tags
  const popularTags = [
    { label: "บัตรประชาชน", query: "บัตรประชาชน" },
    { label: "แบบสำรวจ", query: "แบบสำรวจ" },
    { label: "สัญญา", query: "สัญญา" },
  ];

  return (
    <section className={`w-full ${bgClass} font-sans`}>
      <div className="container-main section-padding">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Heading */}
          <h1 className="text-h1 text-foreground">
            สร้างฟอร์มออนไลน์
            <br />
            อัจฉริยะด้วย Dooform
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-body-lg text-text-default">
            ค้นหาเทมเพลตที่เหมาะกับธุรกิจของคุณ
            <br />
            และเริ่มต้นสร้างฟอร์มได้ทันที
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            className="mt-8 w-full max-w-xl relative"
          >
            <div className="flex items-center bg-background border border-border-default rounded-full overflow-hidden shadow-sm focus-within:border-primary transition-colors">
              {/* Search Icon */}
              <div className="pl-4 pr-2">
                <SearchIcon className="w-5 h-5 text-primary" />
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                name="search"
                placeholder={
                  loading ? "กำลังโหลด..." : "ค้นหาเทมเพลตที่คุณต้องการ..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1 py-3 pr-2 text-sm text-foreground bg-transparent border-none outline-none placeholder:text-text-muted disabled:opacity-50"
                autoComplete="off"
              />

              {/* Search Button */}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                ค้นหา
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-background border border-border-default rounded-xl shadow-lg overflow-hidden z-50"
              >
                {suggestions.map((template, index) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSuggestionClick(template)}
                    className={`w-full px-4 py-3 text-left hover:bg-surface-alt transition-colors border-b border-border-default last:border-b-0 ${
                      index === selectedIndex ? "bg-surface-alt" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <SearchIcon className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {template.display_name ||
                            template.name ||
                            template.filename}
                        </p>
                        {template.description && (
                          <p className="text-xs text-text-muted truncate mt-0.5">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {template.category && (
                            <span className="text-xs text-primary">
                              {template.category}
                            </span>
                          )}
                          {template.author && (
                            <span className="text-xs text-text-muted">
                              โดย {template.author}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {/* View all results link */}
                <Link
                  href={`/forms?search=${encodeURIComponent(searchQuery)}`}
                  className="block w-full px-4 py-3 text-center text-sm text-primary hover:bg-surface-alt transition-colors"
                  onClick={() => setShowSuggestions(false)}
                >
                  ดูผลลัพธ์ทั้งหมด
                </Link>
              </div>
            )}
          </form>

          {/* Popular searches */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-body-sm text-text-muted">
            <span>ยอดนิยม:</span>
            {popularTags.map((tag) => (
              <button
                key={tag.query}
                type="button"
                onClick={() => {
                  setSearchQuery(tag.query);
                  inputRef.current?.focus();
                }}
                className="px-3 py-1 rounded-full bg-surface-alt hover:bg-border-default transition-colors"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

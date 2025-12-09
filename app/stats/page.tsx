"use client";

import { useEffect, useState } from "react";
import { BarChart3, FileText, Download, TrendingUp, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { StatisticsResponse, TimeSeriesPoint } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/app/components/ui/Button";
import Link from "next/link";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-background border border-border-default rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <p className="text-body-sm text-text-muted">{label}</p>
      </div>
      <p className="text-h3 text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

function TrendChart({ data, label }: { data: TimeSeriesPoint[]; label: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-text-muted">
        ไม่มีข้อมูล
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const roundedMax = Math.ceil(maxValue / 10) * 10 || 10;
  const chartHeight = 192;

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 w-10 flex flex-col justify-between" style={{ height: chartHeight }}>
        {[roundedMax, Math.round(roundedMax * 0.5), 0].map((val, i) => (
          <span key={i} className="text-caption text-text-muted text-right pr-2 leading-none">
            {val}
          </span>
        ))}
      </div>

      {/* Chart area */}
      <div className="ml-12">
        {/* Grid lines */}
        <div className="absolute left-12 right-0 top-0 flex flex-col justify-between pointer-events-none" style={{ height: chartHeight }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-t border-border-default w-full" />
          ))}
        </div>

        {/* Bars container */}
        <div className="relative flex items-end gap-1" style={{ height: chartHeight }}>
          {data.map((item, index) => {
            const barHeight = (item.count / roundedMax) * chartHeight;
            return (
              <div key={index} className="flex-1 relative group" style={{ height: chartHeight }}>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-primary/80 rounded-t transition-all duration-200 hover:bg-primary cursor-pointer"
                  style={{ height: Math.max(barHeight, 2) }}
                />
                {/* Tooltip */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
                  style={{ bottom: Math.max(barHeight, 2) + 8 }}
                >
                  <div className="bg-foreground text-background text-caption px-2 py-1 rounded whitespace-nowrap">
                    {item.count.toLocaleString()} {label}
                    <br />
                    <span className="text-xs opacity-75">{formatDate(item.date)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          {data.length > 0 && (
            <>
              <span className="text-caption text-text-muted">{formatDate(data[0].date)}</span>
              {data.length > 1 && (
                <span className="text-caption text-text-muted">{formatDate(data[data.length - 1].date)}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

// Grid Heatmap - fixed size cells with color intensity
function TemplateGridHeatmap({ templates }: { templates: StatisticsResponse["templates"] }) {
  const [hoveredTemplate, setHoveredTemplate] = useState<StatisticsResponse["templates"][0] | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        ยังไม่มีข้อมูลสถิติของเทมเพลต
      </div>
    );
  }

  // Helper to get short display name (max 10 chars)
  const getShortName = (template: StatisticsResponse["templates"][0]) => {
    let name = template.template_name || `T-${template.template_id.slice(0, 6)}`;
    if (name.length > 12) {
      return name.slice(0, 10) + "..";
    }
    return name;
  };

  const getFullName = (template: StatisticsResponse["templates"][0]) => {
    return template.template_name || `Template ${template.template_id.slice(0, 8)}`;
  };

  // Sort by form_submits descending
  const sorted = [...templates]
    .filter(t => t.form_submits > 0)
    .sort((a, b) => b.form_submits - a.form_submits);

  const maxCount = Math.max(...sorted.map(t => t.form_submits), 1);
  const totalSubmits = sorted.reduce((sum, t) => sum + t.form_submits, 0);

  // Get color based on intensity (using log scale for better distribution)
  const getHeatColor = (count: number) => {
    // Use log scale to handle skewed data
    const logMax = Math.log(maxCount + 1);
    const logCount = Math.log(count + 1);
    const intensity = logCount / logMax;

    // Teal color palette from light to dark
    if (intensity > 0.9) return "#115e59"; // darkest
    if (intensity > 0.8) return "#0f766e";
    if (intensity > 0.7) return "#0d9488";
    if (intensity > 0.6) return "#14b8a6";
    if (intensity > 0.5) return "#2dd4bf";
    if (intensity > 0.4) return "#5eead4";
    if (intensity > 0.3) return "#99f6e4";
    if (intensity > 0.2) return "#a7f3d0";
    if (intensity > 0.1) return "#d1fae5";
    return "#ecfdf5"; // lightest
  };

  // Determine ranking tier
  const getRankTier = (index: number, total: number) => {
    const percentile = ((index + 1) / total) * 100;
    if (percentile <= 25) return { label: "Leading (top 25%)", color: "#10b981" };
    if (percentile <= 50) return { label: "Above Average", color: "#3b82f6" };
    if (percentile <= 75) return { label: "Average", color: "#f59e0b" };
    return { label: "Below Average", color: "#6b7280" };
  };

  return (
    <div className="space-y-4">
      {/* Grid Heatmap */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
        {sorted.slice(0, 24).map((template, index) => {
          const percentage = (template.form_submits / totalSubmits) * 100;
          const bgColor = getHeatColor(template.form_submits);
          const isHovered = hoveredTemplate?.template_id === template.template_id;
          const isDark = template.form_submits > maxCount * 0.3;

          return (
            <div
              key={template.template_id}
              className={`
                relative aspect-square rounded-md cursor-pointer
                transition-all duration-200 flex items-center justify-center
                ${isHovered ? "ring-2 ring-gray-900 ring-offset-1 z-10 scale-105" : ""}
              `}
              style={{ backgroundColor: bgColor }}
              onMouseEnter={(e) => {
                setHoveredTemplate(template);
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipPos({
                  x: rect.left + rect.width / 2,
                  y: rect.bottom + 8
                });
              }}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              <span
                className={`text-xs font-medium text-center px-1 leading-tight ${isDark ? "text-white" : "text-teal-900"}`}
              >
                {getShortName(template)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredTemplate && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: "translateX(-50%)",
          }}
        >
          <div className="bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden min-w-[200px]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="font-semibold text-sm">{getFullName(hoveredTemplate)}</p>
            </div>
            {/* Content */}
            <div className="px-4 py-3 space-y-2">
              {/* Rank Tier */}
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getRankTier(sorted.indexOf(hoveredTemplate), sorted.length).color }}
                />
                <span className="text-xs text-gray-300">
                  {getRankTier(sorted.indexOf(hoveredTemplate), sorted.length).label}
                </span>
              </div>
              {/* Stats */}
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Submissions</span>
                <span className="font-medium">{hoveredTemplate.form_submits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Percentage</span>
                <span className="font-medium">{((hoveredTemplate.form_submits / totalSubmits) * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between pt-4 border-t border-border-default">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">น้อย</span>
          <div className="flex gap-0.5">
            {["#ecfdf5", "#d1fae5", "#a7f3d0", "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#115e59"].map((color, i) => (
              <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }} />
            ))}
          </div>
          <span className="text-xs text-text-muted">มาก</span>
        </div>
        <span className="text-sm font-medium text-foreground">{totalSubmits.toLocaleString()} submissions</span>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getStatistics();
      setStats(data);
    } catch (err) {
      console.error("Failed to load statistics:", err);
      setError(err instanceof Error ? err.message : "Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-alt flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-alt flex items-center justify-center">
        <div className="bg-background border border-border-default rounded-xl p-8 text-center max-w-md">
          <BarChart3 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-h3 text-foreground mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-text-muted mb-6">คุณต้องเข้าสู่ระบบเพื่อดูสถิติการใช้งาน</p>
          <Button href="/login" variant="primary">
            เข้าสู่ระบบ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-alt font-sans">
      <div className="container-main section-padding">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h1 className="text-h2 text-foreground">สถิติการใช้งาน</h1>
          </div>
          <Button
            variant="secondary"
            onClick={loadStats}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            รีเฟรช
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-background border border-border-default rounded-xl p-5 animate-pulse">
                <div className="h-6 bg-surface-alt rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-surface-alt rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard
                label="ส่งแบบฟอร์มทั้งหมด"
                value={stats.summary.total_form_submits}
                icon={<FileText className="w-5 h-5 text-blue-600" />}
                color="bg-blue-100"
              />
              <StatCard
                label="ส่งออกเอกสารทั้งหมด"
                value={stats.summary.total_exports}
                icon={<Download className="w-5 h-5 text-green-600" />}
                color="bg-green-100"
              />
              <StatCard
                label="ดาวน์โหลดทั้งหมด"
                value={stats.summary.total_downloads}
                icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
                color="bg-purple-100"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Form Submissions Trend */}
              <div className="bg-background border border-border-default rounded-xl p-6">
                <h3 className="text-h4 text-foreground mb-6">การส่งแบบฟอร์ม (30 วัน)</h3>
                <TrendChart
                  data={stats.trends?.form_submit?.data_points || []}
                  label="submissions"
                />
              </div>

              {/* Exports Trend */}
              <div className="bg-background border border-border-default rounded-xl p-6">
                <h3 className="text-h4 text-foreground mb-6">การส่งออกเอกสาร (30 วัน)</h3>
                <TrendChart
                  data={stats.trends?.export?.data_points || []}
                  label="exports"
                />
              </div>
            </div>

            {/* Template Stats Grid Heatmap */}
            <div className="bg-background border border-border-default rounded-xl p-6">
              <h3 className="text-h4 text-foreground mb-6">เทมเพลตยอดนิยม</h3>
              <TemplateGridHeatmap templates={stats.templates} />
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-text-muted">
            ไม่มีข้อมูลสถิติ
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/" className="text-primary hover:underline">
            &larr; กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  );
}

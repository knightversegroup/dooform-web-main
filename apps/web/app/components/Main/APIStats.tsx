"use client";

interface Stat {
    label: string;
    value: string;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
}

interface UsageItem {
    rank: number;
    name: string;
    value: string;
    percentage: number;
    color: string;
}

interface APIStatsProps {
    background?: "default" | "alt";
}

// Mock statistics data
const stats: Stat[] = [
    { label: "เอกสารที่สร้างทั้งหมด", value: "12,458", change: "+12%", changeType: "positive" },
    { label: "เทมเพลตที่ใช้งาน", value: "48", change: "+3", changeType: "positive" },
    { label: "ผู้ใช้งานเดือนนี้", value: "1,234", change: "+8%", changeType: "positive" },
    { label: "เวลาเฉลี่ยในการสร้าง", value: "2.3 วินาที", change: "-15%", changeType: "positive" },
];

// Mock top templates usage
const topTemplates: UsageItem[] = [
    { rank: 1, name: "สัญญาจ้างงาน", value: "3,245", percentage: 26.1, color: "#1e3a8a" },
    { rank: 2, name: "ใบสมัครงาน", value: "2,890", percentage: 23.2, color: "#3b82f6" },
    { rank: 3, name: "หนังสือมอบอำนาจ", value: "1,567", percentage: 12.6, color: "#60a5fa" },
    { rank: 4, name: "ใบเสนอราคา", value: "1,234", percentage: 9.9, color: "#93c5fd" },
    { rank: 5, name: "สัญญาเช่า", value: "987", percentage: 7.9, color: "#bfdbfe" },
];

// Mock weekly data for bar chart (last 12 weeks)
const weeklyData = [
    { week: "ส.ค. 5", value: 820, docs: 820 },
    { week: "ส.ค. 12", value: 945, docs: 945 },
    { week: "ส.ค. 19", value: 890, docs: 890 },
    { week: "ส.ค. 26", value: 1020, docs: 1020 },
    { week: "ก.ย. 2", value: 1150, docs: 1150 },
    { week: "ก.ย. 9", value: 980, docs: 980 },
    { week: "ก.ย. 16", value: 1280, docs: 1280 },
    { week: "ก.ย. 23", value: 1190, docs: 1190 },
    { week: "ก.ย. 30", value: 1350, docs: 1350 },
    { week: "ต.ค. 7", value: 1420, docs: 1420 },
    { week: "ต.ค. 14", value: 1180, docs: 1180 },
    { week: "ต.ค. 21", value: 1560, docs: 1560 },
];

function StatCard({ stat }: { stat: Stat }) {
    const changeColor =
        stat.changeType === "positive"
            ? "text-green-600"
            : stat.changeType === "negative"
            ? "text-red-600"
            : "text-text-muted";

    return (
        <div className="bg-background border border-border-default rounded-xl p-5">
            <p className="text-body-sm text-text-muted mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-h3 text-foreground">{stat.value}</p>
                {stat.change && (
                    <span className={`text-caption font-medium ${changeColor}`}>
                        {stat.change}
                    </span>
                )}
            </div>
        </div>
    );
}

function BarChart({ data }: { data: typeof weeklyData }) {
    const maxValue = Math.max(...data.map((d) => d.value));
    const roundedMax = Math.ceil(maxValue / 500) * 500;
    const yAxisLabels = [roundedMax, roundedMax * 0.75, roundedMax * 0.5, roundedMax * 0.25, 0];
    const chartHeight = 192; // h-48 = 192px

    return (
        <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 w-10 flex flex-col justify-between" style={{ height: chartHeight }}>
                {yAxisLabels.map((label, i) => (
                    <span key={i} className="text-caption text-text-muted text-right pr-2 leading-none">
                        {label >= 1000 ? `${(label / 1000).toFixed(1)}k` : label}
                    </span>
                ))}
            </div>

            {/* Chart area */}
            <div className="ml-12">
                {/* Grid lines */}
                <div className="absolute left-12 right-0 top-0 flex flex-col justify-between pointer-events-none" style={{ height: chartHeight }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-t border-border-default w-full" />
                    ))}
                </div>

                {/* Bars container */}
                <div className="relative flex items-end gap-1" style={{ height: chartHeight }}>
                    {data.map((item, index) => {
                        const barHeight = (item.value / roundedMax) * chartHeight;
                        return (
                            <div key={index} className="flex-1 relative group" style={{ height: chartHeight }}>
                                {/* Bar - positioned at bottom */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-primary/80 rounded-t transition-all duration-200 hover:bg-primary cursor-pointer"
                                    style={{ height: Math.max(barHeight, 4) }}
                                />
                                {/* Tooltip */}
                                <div
                                    className="absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
                                    style={{ bottom: barHeight + 8 }}
                                >
                                    <div className="bg-foreground text-background text-caption px-2 py-1 rounded whitespace-nowrap">
                                        {item.docs.toLocaleString()} เอกสาร
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between mt-2">
                    {data.filter((_, i) => i % 3 === 0 || i === data.length - 1).map((item, index) => (
                        <span key={index} className="text-caption text-text-muted">
                            {item.week}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function UsageList({ items }: { items: UsageItem[] }) {
    return (
        <div className="space-y-4">
            {items.map((item) => (
                <div key={item.rank} className="flex items-center gap-3">
                    <span className="text-body-sm text-text-muted w-6">{item.rank}.</span>
                    <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-body-sm text-foreground truncate">{item.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-body-sm text-foreground">{item.value}</p>
                        <p className="text-caption text-text-muted">{item.percentage}%</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ChartIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
            />
        </svg>
    );
}

export default function APIStats({ background = "default" }: APIStatsProps) {
    const bgClass = background === "alt" ? "bg-surface-alt" : "bg-background";

    return (
        <section className={`w-full ${bgClass} font-sans`}>
            <div className="container-main section-padding">
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-8">
                    <ChartIcon className="w-5 h-5 text-text-muted" />
                    <h2 className="text-h3 text-foreground">สถิติการใช้งาน</h2>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, index) => (
                        <StatCard key={index} stat={stat} />
                    ))}
                </div>

                {/* Chart and Usage Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bar Chart */}
                    <div className="bg-background border border-border-default rounded-xl p-6">
                        <h3 className="text-h4 text-foreground mb-6">เอกสารที่สร้างรายสัปดาห์</h3>
                        <BarChart data={weeklyData} />
                    </div>

                    {/* Top Templates */}
                    <div className="bg-background border border-border-default rounded-xl p-6">
                        <h3 className="text-h4 text-foreground mb-6">เทมเพลตยอดนิยม</h3>
                        <UsageList items={topTemplates} />
                    </div>
                </div>
            </div>
        </section>
    );
}

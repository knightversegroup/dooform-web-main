<script lang="ts">
	interface Props {
		background?: 'default' | 'alt';
	}

	let { background = 'default' }: Props = $props();

	const bgClass = background === 'alt' ? 'bg-surface-alt' : 'bg-background';

	interface Stat {
		label: string;
		value: string;
		change?: string;
		changeType?: 'positive' | 'negative' | 'neutral';
	}

	interface UsageItem {
		rank: number;
		name: string;
		value: string;
		percentage: number;
		color: string;
	}

	const stats: Stat[] = [
		{ label: 'เอกสารที่สร้างทั้งหมด', value: '12,458', change: '+12%', changeType: 'positive' },
		{ label: 'เทมเพลตที่ใช้งาน', value: '48', change: '+3', changeType: 'positive' },
		{ label: 'ผู้ใช้งานเดือนนี้', value: '1,234', change: '+8%', changeType: 'positive' },
		{ label: 'เวลาเฉลี่ยในการสร้าง', value: '2.3 วินาที', change: '-15%', changeType: 'positive' }
	];

	const topTemplates: UsageItem[] = [
		{ rank: 1, name: 'สัญญาจ้างงาน', value: '3,245', percentage: 26.1, color: '#1e3a8a' },
		{ rank: 2, name: 'ใบสมัครงาน', value: '2,890', percentage: 23.2, color: '#3b82f6' },
		{ rank: 3, name: 'หนังสือมอบอำนาจ', value: '1,567', percentage: 12.6, color: '#60a5fa' },
		{ rank: 4, name: 'ใบเสนอราคา', value: '1,234', percentage: 9.9, color: '#93c5fd' },
		{ rank: 5, name: 'สัญญาเช่า', value: '987', percentage: 7.9, color: '#bfdbfe' }
	];

	const weeklyData = [
		{ week: 'ส.ค. 5', value: 820, docs: 820 },
		{ week: 'ส.ค. 12', value: 945, docs: 945 },
		{ week: 'ส.ค. 19', value: 890, docs: 890 },
		{ week: 'ส.ค. 26', value: 1020, docs: 1020 },
		{ week: 'ก.ย. 2', value: 1150, docs: 1150 },
		{ week: 'ก.ย. 9', value: 980, docs: 980 },
		{ week: 'ก.ย. 16', value: 1280, docs: 1280 },
		{ week: 'ก.ย. 23', value: 1190, docs: 1190 },
		{ week: 'ก.ย. 30', value: 1350, docs: 1350 },
		{ week: 'ต.ค. 7', value: 1420, docs: 1420 },
		{ week: 'ต.ค. 14', value: 1180, docs: 1180 },
		{ week: 'ต.ค. 21', value: 1560, docs: 1560 }
	];

	const maxValue = Math.max(...weeklyData.map((d) => d.value));
	const roundedMax = Math.ceil(maxValue / 500) * 500;
	const yAxisLabels = [roundedMax, roundedMax * 0.75, roundedMax * 0.5, roundedMax * 0.25, 0];
	const chartHeight = 192;

	function formatLabel(label: number) {
		return label >= 1000 ? `${(label / 1000).toFixed(1)}k` : String(label);
	}
</script>

<section class="w-full {bgClass}">
	<div class="container-main section-padding">
		<!-- Section Header -->
		<div class="flex items-center gap-2 mb-8">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-5 h-5 text-text-muted"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
				/>
			</svg>
			<h2 class="text-h3 text-foreground">สถิติการใช้งาน</h2>
		</div>

		<!-- Stats Grid -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
			{#each stats as stat}
				<div class="bg-background border border-border-default rounded-xl p-5">
					<p class="text-body-sm text-text-muted mb-1">{stat.label}</p>
					<div class="flex items-baseline gap-2">
						<p class="text-h3 text-foreground">{stat.value}</p>
						{#if stat.change}
							<span
								class="text-caption font-medium {stat.changeType === 'positive'
									? 'text-green-600'
									: stat.changeType === 'negative'
										? 'text-red-600'
										: 'text-text-muted'}"
							>
								{stat.change}
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Chart and Usage Section -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Bar Chart -->
			<div class="bg-background border border-border-default rounded-xl p-6">
				<h3 class="text-h4 text-foreground mb-6">เอกสารที่สร้างรายสัปดาห์</h3>
				<div class="relative">
					<!-- Y-axis labels -->
					<div
						class="absolute left-0 top-0 w-10 flex flex-col justify-between"
						style="height: {chartHeight}px"
					>
						{#each yAxisLabels as label}
							<span class="text-caption text-text-muted text-right pr-2 leading-none">
								{formatLabel(label)}
							</span>
						{/each}
					</div>

					<!-- Chart area -->
					<div class="ml-12">
						<!-- Grid lines -->
						<div
							class="absolute left-12 right-0 top-0 flex flex-col justify-between pointer-events-none"
							style="height: {chartHeight}px"
						>
							{#each [0, 1, 2, 3, 4] as _}
								<div class="border-t border-border-default w-full"></div>
							{/each}
						</div>

						<!-- Bars container -->
						<div class="relative flex items-end gap-1" style="height: {chartHeight}px">
							{#each weeklyData as item}
								{@const barHeight = (item.value / roundedMax) * chartHeight}
								<div class="flex-1 relative group" style="height: {chartHeight}px">
									<div
										class="absolute bottom-0 left-0 right-0 bg-primary/80 rounded-t transition-all duration-200 hover:bg-primary cursor-pointer"
										style="height: {Math.max(barHeight, 4)}px"
									></div>
									<div
										class="absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
										style="bottom: {barHeight + 8}px"
									>
										<div
											class="bg-foreground text-background text-caption px-2 py-1 rounded whitespace-nowrap"
										>
											{item.docs.toLocaleString()} เอกสาร
										</div>
									</div>
								</div>
							{/each}
						</div>

						<!-- X-axis labels -->
						<div class="flex justify-between mt-2">
							{#each weeklyData.filter((_, i) => i % 3 === 0 || i === weeklyData.length - 1) as item}
								<span class="text-caption text-text-muted">{item.week}</span>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Top Templates -->
			<div class="bg-background border border-border-default rounded-xl p-6">
				<h3 class="text-h4 text-foreground mb-6">เทมเพลตยอดนิยม</h3>
				<div class="space-y-4">
					{#each topTemplates as item}
						<div class="flex items-center gap-3">
							<span class="text-body-sm text-text-muted w-6">{item.rank}.</span>
							<div
								class="w-3 h-3 rounded-full flex-shrink-0"
								style="background-color: {item.color}"
							></div>
							<div class="flex-1 min-w-0">
								<p class="text-body-sm text-foreground truncate">{item.name}</p>
							</div>
							<div class="text-right">
								<p class="text-body-sm text-foreground">{item.value}</p>
								<p class="text-caption text-text-muted">{item.percentage}%</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

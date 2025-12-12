<script lang="ts">
	import { ArrowUpRight } from 'lucide-svelte';

	interface Props {
		background?: 'default' | 'alt';
	}

	let { background = 'default' }: Props = $props();

	const bgClass = background === 'alt' ? 'bg-surface-alt' : 'bg-background';

	interface SolutionItem {
		id: string;
		title: string;
		description: string;
		imageUrl: string;
		linkUrl: string;
	}

	const solutions: SolutionItem[] = [
		{
			id: '1',
			title: 'จัดการเอกสารทางกฎหมาย',
			description: 'สร้างแบบสำรวจความพึงพอใจลูกค้าได้อย่างง่ายดาย',
			imageUrl: '/mockup/example-1.png',
			linkUrl: '/solutions/survey'
		},
		{
			id: '2',
			title: 'ระบบใบเสร็จครบวงจรกับบริษัทนำเที่ยว',
			description: 'จัดการการลงทะเบียนงานอีเวนต์และกิจกรรมต่างๆ',
			imageUrl: '/mockup/example-2.png',
			linkUrl: '/solutions/registration'
		},
		{
			id: '3',
			title: 'เอกสารสำหรับบริษัทรับทำวีซ่า',
			description: 'รับออเดอร์และจัดการคำสั่งซื้อได้อย่างมีประสิทธิภาพ',
			imageUrl: '/mockup/example-3.png',
			linkUrl: '/solutions/order'
		},
		{
			id: '4',
			title: 'ลดงานแปลเอกสารสำหรับบริษัทรับแปล',
			description: 'สร้างแบบฟอร์มรับสมัครงานและจัดการผู้สมัครได้ง่าย',
			imageUrl: '/mockup/example-4.png',
			linkUrl: '/solutions/recruitment'
		},
		{
			id: '5',
			title: 'แบบฟอร์มนัดหมาย',
			description: 'จัดการการนัดหมายและจองเวลาได้อย่างสะดวก',
			imageUrl: '/mockup/1102.webp',
			linkUrl: '/solutions/booking'
		}
	];
</script>

<section class={bgClass}>
	<div class="container-main section-padding">
		<!-- Header -->
		<div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
			<div>
				<p class="text-body text-text-muted mb-2">เลือกโซลูชันที่เหมาะกับธุรกิจของคุณ</p>
				<h2 class="text-h2 text-text-default">ดูฟอร์มกับธุรกิจ</h2>
			</div>

			<a href="/solutions" class="text-body-sm text-text-muted hover:text-primary transition-colors">
				ดูทั้งหมด
			</a>
		</div>

		<!-- Scrollable Cards -->
		<div
			class="flex gap-6 overflow-x-auto pb-4"
			style="scrollbar-width: none; -ms-overflow-style: none;"
		>
			{#each solutions as item}
				<div class="group flex-shrink-0 w-[300px] lg:w-[320px]">
					<!-- Image -->
					<div class="relative h-96 w-full overflow-hidden rounded-xl mb-4 bg-surface-alt">
						<img
							src={item.imageUrl}
							alt={item.title}
							class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					</div>

					<!-- Content -->
					<h3 class="text-h4 text-text-default mb-2 group-hover:text-primary transition-colors">
						{item.title}
					</h3>
					<p class="text-body-sm text-text-muted mb-3">{item.description}</p>
					<a
						href={item.linkUrl}
						class="inline-flex items-center text-body-sm font-semibold text-text-default hover:text-primary transition-colors"
					>
						ดูรายละเอียด
						<ArrowUpRight class="ml-1 h-4 w-4" />
					</a>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	div::-webkit-scrollbar {
		display: none;
	}
</style>

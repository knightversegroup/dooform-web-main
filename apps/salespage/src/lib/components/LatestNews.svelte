<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';

	interface Props {
		background?: 'default' | 'alt';
	}

	let { background = 'default' }: Props = $props();

	const bgClass = background === 'alt' ? 'bg-surface-alt' : 'bg-background';

	interface NewsItem {
		id: string;
		date: string;
		title: string;
		description: string;
		category: string;
		image: string;
		href: string;
	}

	const newsItems: NewsItem[] = [
		{
			id: '1',
			date: '3 ธันวาคม 2567',
			title: 'เปิดตัว Dooform 2.0 พร้อมฟีเจอร์ AI ใหม่',
			description:
				'อัปเดตครั้งใหญ่พร้อมระบบ AI ที่ช่วยกรอกฟอร์มอัตโนมัติ และเทมเพลตใหม่กว่า 50 รายการ',
			category: 'Product',
			image: '/cover-1.webp',
			href: '/news/dooform-2-launch'
		},
		{
			id: '2',
			date: '28 พฤศจิกายน 2567',
			title: 'แนะนำการใช้งานเทมเพลตสัญญาจ้างงาน',
			description:
				'คู่มือการใช้งานเทมเพลตสัญญาจ้างงานอย่างละเอียด พร้อมตัวอย่างการกรอกข้อมูล',
			category: 'Tutorial',
			image: '/cover-1.webp',
			href: '/news/contract-template-guide'
		},
		{
			id: '3',
			date: '20 พฤศจิกายน 2567',
			title: 'Dooform รองรับการส่งออกเป็น PDF แล้ว',
			description: 'ตอนนี้คุณสามารถส่งออกเอกสารเป็นไฟล์ PDF ได้โดยตรงจากระบบ',
			category: 'Feature',
			image: '/cover-1.webp',
			href: '/news/pdf-export-feature'
		}
	];
</script>

<section class="w-full {bgClass}">
	<div class="container-main section-padding">
		<!-- Section Header -->
		<div class="flex items-center justify-between mb-8">
			<h2 class="text-h2 text-foreground">ข่าวสารล่าสุด</h2>
			<a href="/news" class="inline-flex items-center gap-2 text-body-sm text-primary hover:underline">
				ดูทั้งหมด
				<ArrowRight class="w-4 h-4" />
			</a>
		</div>

		<!-- News List -->
		<div class="border-t border-border-default">
			{#each newsItems as item}
				<article
					class="group flex flex-col gap-6 border-b border-border-default py-8 first:pt-0 last:border-b-0 md:flex-row md:gap-8"
				>
					<!-- Content - Left side on desktop -->
					<div class="order-2 flex flex-1 flex-col gap-4 md:order-1">
						<!-- Date -->
						<p class="text-caption text-text-muted font-medium tracking-wide">{item.date}</p>

						<!-- Title & Description -->
						<div class="flex flex-col gap-3">
							<a href={item.href} class="group/link">
								<h3
									class="text-h4 text-foreground group-hover/link:text-primary transition-colors"
								>
									{item.title}
								</h3>
							</a>
							<p class="text-body-sm text-text-muted">{item.description}</p>
						</div>

						<!-- Category & Read button -->
						<div class="flex items-center justify-between gap-3 mt-auto pt-2">
							<span
								class="inline-flex items-center px-2.5 py-1 rounded-full text-caption font-medium bg-primary/10 text-primary"
							>
								{item.category}
							</span>
							<a
								href={item.href}
								class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-default text-caption font-medium text-text-default hover:bg-surface-alt hover:border-primary/30 transition-colors"
							>
								อ่านเพิ่มเติม
								<ArrowRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
							</a>
						</div>
					</div>

					<!-- Image - Right side on desktop -->
					<div class="order-1 flex-shrink-0 md:order-2 md:w-[280px] lg:w-[360px]">
						<a href={item.href} class="block overflow-hidden rounded-lg">
							<div class="relative aspect-[16/10] bg-surface-alt">
								<img
									src={item.image}
									alt={item.title}
									class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
							</div>
						</a>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>

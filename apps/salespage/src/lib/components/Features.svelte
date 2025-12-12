<script lang="ts">
	import { Users, Layers, LayoutGrid, FileText } from 'lucide-svelte';
	import type { Component } from 'svelte';

	interface Props {
		background?: 'default' | 'alt';
	}

	let { background = 'default' }: Props = $props();

	const bgClass = background === 'alt' ? 'bg-surface-alt' : 'bg-background';

	interface FeatureTile {
		id: string;
		title: string;
		description: string;
		linkText: string;
		linkHref: string;
		icon: Component;
	}

	const featureTiles: FeatureTile[] = [
		{
			id: 'design-system',
			title: 'ระบบออกแบบสำหรับใคร?',
			description:
				'ระบบออกแบบนี้สร้างขึ้นเพื่อบริการภาครัฐ ค้นหาขอบเขตการใช้งานเพื่อเริ่มต้นใช้งาน',
			linkText: 'ขอบเขตการใช้งาน',
			linkHref: '/scope',
			icon: Users
		},
		{
			id: 'fundamentals',
			title: 'หลักการพื้นฐาน',
			description: 'ระบบนี้ตั้งอยู่บนหลักการพื้นฐานที่จำเป็นต้องรู้ก่อนเริ่มใช้งาน',
			linkText: 'ดูหลักการพื้นฐาน',
			linkHref: '/fundamentals',
			icon: Layers
		},
		{
			id: 'components',
			title: 'คลังส่วนประกอบ',
			description: 'มีส่วนประกอบมากกว่า 50 รายการพร้อมใช้งานเพื่อเร่งโปรเจกต์ของคุณ',
			linkText: 'ดูส่วนประกอบทั้งหมด',
			linkHref: '/components',
			icon: LayoutGrid
		},
		{
			id: 'templates',
			title: 'เทมเพลตและตัวอย่าง',
			description: 'มีฟอร์มมาตรฐานและเทมเพลตหน้าอย่างเป็นทางการพร้อมนำไปใช้ซ้ำ',
			linkText: 'ดูเทมเพลตทั้งหมด',
			linkHref: '/templates',
			icon: FileText
		}
	];
</script>

<section class={bgClass}>
	<div class="container-main section-padding">
		<h2 class="text-h2 text-foreground mb-10">ค้นพบ</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each featureTiles as tile}
				<div class="p-4">
					<div class="flex flex-col h-full">
						<div class="mb-4">
							<tile.icon class="w-12 h-12 text-primary" />
						</div>

						<div class="grow">
							<h3 class="text-h4 text-foreground mb-2">{tile.title}</h3>
							<p class="text-body-sm text-text-default">{tile.description}</p>
						</div>

						<div class="mt-4">
							<a
								href={tile.linkHref}
								class="inline-flex items-center text-primary hover:underline font-medium text-body-sm group"
							>
								{tile.linkText}
								<span class="ml-1 transition-transform group-hover:translate-x-1">&rarr;</span>
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

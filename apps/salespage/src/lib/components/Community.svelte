<script lang="ts">
	import { MessageCircle, Users, HelpCircle, ArrowRight } from 'lucide-svelte';
	import type { Component } from 'svelte';

	interface Props {
		background?: 'default' | 'alt';
	}

	let { background = 'alt' }: Props = $props();

	const bgClass = background === 'alt' ? 'bg-surface-alt' : 'bg-background';

	interface CommunityTile {
		icon: Component;
		title: string;
		description: string;
		linkText: string;
		href: string;
	}

	const communityTiles: CommunityTile[] = [
		{
			icon: MessageCircle,
			title: 'ชุมชน Dooform',
			description: 'พูดคุยแลกเปลี่ยนความคิดเห็นกับผู้ใช้งานคนอื่นๆ',
			linkText: 'เข้าร่วมชุมชน',
			href: '#'
		},
		{
			icon: Users,
			title: 'ทีมสนับสนุน',
			description: 'ติดต่อทีมงานเพื่อขอความช่วยเหลือในการใช้งาน',
			linkText: 'ติดต่อทีมงาน',
			href: '#'
		},
		{
			icon: HelpCircle,
			title: 'ศูนย์ช่วยเหลือ',
			description: 'ส่งคำถามหรือข้อเสนอแนะเพื่อพัฒนาระบบ',
			linkText: 'ส่งคำถาม',
			href: '#'
		}
	];
</script>

<section class="w-full {bgClass}">
	<div class="container-main section-padding">
		<!-- Section Title -->
		<h2 class="text-h2 text-foreground mb-12">สำหรับนักพัฒนา</h2>

		<div class="flex flex-col lg:flex-row gap-12 lg:gap-16">
			<!-- Left side - Video -->
			<div class="flex-1 lg:max-w-[55%]">
				<div class="bg-surface-alt rounded-xl overflow-hidden aspect-video">
					<img
						src="/cover-1.webp"
						alt="Community video placeholder"
						width="800"
						height="450"
						class="w-full h-full object-cover"
					/>
				</div>
			</div>

			<!-- Right side - Info Tiles -->
			<div class="flex-1 flex flex-col gap-8">
				{#each communityTiles as tile}
					<div class="flex gap-4">
						<!-- Icon -->
						<div
							class="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-background rounded-lg"
						>
							<tile.icon class="w-6 h-6 text-primary" />
						</div>

						<!-- Content -->
						<div class="flex flex-col gap-1">
							<h3 class="text-h4 text-foreground">{tile.title}</h3>
							<p class="text-body-sm text-text-muted">{tile.description}</p>
							<a
								href={tile.href}
								class="inline-flex items-center gap-1 text-body-sm text-primary hover:underline mt-1"
							>
								{tile.linkText}
								<ArrowRight class="w-4 h-4" />
							</a>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

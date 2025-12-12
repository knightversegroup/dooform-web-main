<script lang="ts">
	import { ArrowUpRight } from 'lucide-svelte';

	const currentYear = new Date().getFullYear();

	const footerLinks = {
		application: {
			title: 'เกี่ยวกับแอปพลิเคชั่น',
			links: [
				{ label: 'รายการเอกสาร', href: '/documents' },
				{ label: 'แบบฟอร์มทั้งหมด', href: '/templates' }
			]
		},
		legal: {
			title: 'ข้อบังคับทางกฎหมาย',
			links: [
				{ label: 'นโยบายคุกกี้', href: '/documents/cookie-policy' },
				{ label: 'นโยบายความเป็นส่วนตัว', href: '/documents/privacy-notice' }
			]
		}
	};
</script>

<footer class="flex w-full justify-between text-sm">
	<div class="container-main section-padding-sm">
		<div class="flex flex-col items-start gap-6 text-foreground">
			<!-- Main content row -->
			<div class="flex w-full flex-col items-start justify-between gap-6 lg:flex-row lg:gap-2">
				<!-- Brand section -->
				<div class="flex shrink-0 flex-col items-start justify-center gap-2">
					<a href="/">
						<img src="/logo.svg" alt="Dooform logo" width="120" height="32" class="my-2 h-8" />
					</a>
					<div class="flex flex-col gap-2 text-text-muted">
						<p>
							&copy; {currentYear} Dooform by Knight Consultant
							<br />
							Under License of Rinkai
						</p>
					</div>
				</div>

				<!-- Links grid -->
				<div
					class="grid w-full grid-cols-2 items-start gap-6 md:grid-cols-4 lg:flex lg:justify-end lg:gap-12"
				>
					{#each Object.values(footerLinks) as section}
						<ul class="flex flex-col gap-2">
							<li class="font-semibold">{section.title}</li>
							{#each section.links as link}
								<li>
									<a
										href={link.href}
										class="text-text-muted hover:text-foreground transition-colors"
									>
										{link.label}
									</a>
								</li>
							{/each}
						</ul>
					{/each}
				</div>
			</div>

			<!-- Bottom row -->
			<div
				class="flex w-full flex-col items-center justify-between gap-2 border-t border-border-default pt-6 sm:flex-row"
			>
				<ul class="flex flex-col items-start justify-start">
					<li class="flex items-center gap-1">
						<a
							href="https://www.knightvisahelppoint.com/"
							target="_blank"
							rel="noopener noreferrer"
							class="text-text-muted hover:text-foreground transition-colors"
						>
							knight consultant worldwide company limited
						</a>
						<ArrowUpRight class="h-4 w-4 text-text-muted" />
					</li>
				</ul>
				<p class="text-text-muted text-center sm:text-right">
					การใช้งานเว็บไซต์นี้นับว่าคุณได้ยอมรับเงื่อนไขในการใช้งานเรียบร้อย
				</p>
			</div>
		</div>
	</div>
</footer>

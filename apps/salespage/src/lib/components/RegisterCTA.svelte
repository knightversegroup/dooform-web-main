<script lang="ts">
	interface Props {
		background?: 'default' | 'alt';
	}

	let { background = 'alt' }: Props = $props();

	const bgClass = background === 'alt' ? 'bg-surface-alt' : 'bg-background';
	const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000';
</script>

<section class="w-full {bgClass}">
	<div class="container-main section-padding">
		<div class="text-center max-w-2xl mx-auto">
			<h2 class="text-h2 text-foreground mb-4">พร้อมเริ่มต้นใช้งานแล้วหรือยัง?</h2>
			<p class="text-body-lg text-text-default mb-8">
				ลงทะเบียนฟรีวันนี้และเริ่มสร้างฟอร์มออนไลน์อัจฉริยะกับ Dooform
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a
					href="{APP_URL}/register"
					class="inline-block px-8 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
				>
					เริ่มต้นใช้งานฟรี
				</a>
				<a
					href="/templates"
					class="inline-block px-8 py-3 text-sm font-semibold text-text-default border border-border-default hover:bg-surface-alt rounded-lg transition-colors"
				>
					ดูเทมเพลตทั้งหมด
				</a>
			</div>
		</div>
	</div>
</section>

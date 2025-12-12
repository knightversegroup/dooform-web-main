<script lang="ts">
	interface Props {
		background?: 'default' | 'alt';
	}

	let { background = 'alt' }: Props = $props();

	const bgClass = background === 'alt' ? 'bg-surface-alt' : 'bg-background';
</script>

<section class="w-full {bgClass}">
	<div class="container-main section-padding">
		<div class="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
			<!-- Content - Left side -->
			<div class="flex-1 lg:max-w-[50%]">
				<h2 class="text-h1 text-foreground">หมดปัญหาจัดการเอกสารแบบเดิมๆ ด้วย Dooform</h2>
				<p class="mt-6 text-body-lg text-text-default">
					ลดเวลากับการจัดฟอร์แมตเอกสารให้กับบริษัทของคุณด้วยเครื่องมือสร้างฟอร์มออนไลน์ที่ใช้งานง่ายและรวดเร็ว
				</p>
				<div class="mt-8">
					<a
						href="#"
						class="inline-block px-6 py-3 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
					>
						เริ่มต้นใช้งาน Dooform
					</a>
				</div>
			</div>

			<!-- Image - Right side with Mac window frame -->
			<div class="flex-1">
				<div class="bg-[#e8e8e8] rounded-xl shadow-2xl overflow-hidden">
					<!-- Mac window title bar -->
					<div class="flex items-center gap-2 px-4 py-3 bg-[#e8e8e8] border-b border-border-default">
						<div class="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
						<div class="w-3 h-3 rounded-full bg-[#febc2e]"></div>
						<div class="w-3 h-3 rounded-full bg-[#28c840]"></div>
					</div>
					<!-- Window content -->
					<img src="/example.webp" alt="" width="600" height="500" class="w-full h-auto" aria-hidden="true" />
				</div>
			</div>
		</div>
	</div>
</section>

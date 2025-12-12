<script lang="ts">
	import { Search } from 'lucide-svelte';

	interface Props {
		background?: 'default' | 'alt';
	}

	let { background = 'default' }: Props = $props();

	let searchQuery = $state('');
	let inputRef: HTMLInputElement;

	const bgClass = background === 'alt' ? 'bg-surface-alt' : 'bg-background';

	const popularTags = [
		{ label: 'บัตรประชาชน', query: 'บัตรประชาชน' },
		{ label: 'แบบสำรวจ', query: 'แบบสำรวจ' },
		{ label: 'สัญญา', query: 'สัญญา' }
	];

	function handleSearch(e: SubmitEvent) {
		e.preventDefault();
		if (searchQuery.trim()) {
			window.location.href = `/templates?search=${encodeURIComponent(searchQuery.trim())}`;
		}
	}

	function setSearchQuery(query: string) {
		searchQuery = query;
		inputRef?.focus();
	}
</script>

<section class="w-full {bgClass}">
	<div class="container-main section-padding">
		<div class="flex flex-col items-center text-center max-w-3xl mx-auto">
			<!-- Heading -->
			<h1 class="text-h1 text-foreground">
				สร้างฟอร์มออนไลน์
				<br />
				อัจฉริยะด้วย Dooform
			</h1>

			<!-- Subtitle -->
			<p class="mt-4 text-body-lg text-text-default">
				ค้นหาเทมเพลตที่เหมาะกับธุรกิจของคุณ
				<br />
				และเริ่มต้นสร้างฟอร์มได้ทันที
			</p>

			<!-- Search Form -->
			<form onsubmit={handleSearch} class="mt-8 w-full max-w-xl relative">
				<div
					class="flex items-center bg-background border border-border-default rounded-full overflow-hidden shadow-sm focus-within:border-primary transition-colors"
				>
					<!-- Search Icon -->
					<div class="pl-4 pr-2">
						<Search class="w-5 h-5 text-primary" />
					</div>

					<!-- Input -->
					<input
						bind:this={inputRef}
						type="text"
						name="search"
						placeholder="ค้นหาเทมเพลตที่คุณต้องการ..."
						bind:value={searchQuery}
						class="flex-1 py-3 pr-2 text-sm text-foreground bg-transparent border-none outline-none placeholder:text-text-muted"
						autocomplete="off"
					/>

					<!-- Search Button -->
					<button
						type="submit"
						class="px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors"
					>
						ค้นหา
					</button>
				</div>
			</form>

			<!-- Popular searches -->
			<div class="mt-4 flex flex-wrap items-center justify-center gap-2 text-body-sm text-text-muted">
				<span>ยอดนิยม:</span>
				{#each popularTags as tag}
					<button
						type="button"
						onclick={() => setSearchQuery(tag.query)}
						class="px-3 py-1 rounded-full bg-surface-alt hover:bg-border-default transition-colors"
					>
						{tag.label}
					</button>
				{/each}
			</div>
		</div>
	</div>
</section>

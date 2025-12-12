<script lang="ts">
	import { Menu, Search, X } from 'lucide-svelte';

	// Configuration - Update these URLs for your main app
	const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000';

	let isMenuOpen = $state(false);
	let isSearchOpen = $state(false);

	const navigationItems = [
		{ label: 'แบบฟอร์ม', href: '/templates' },
		{ label: 'เอกสารประกอบ', href: '/documents' }
	];
</script>

<header class="sticky top-0 z-50 bg-background border-b border-border-default">
	<!-- Header Body -->
	<div class="py-4">
		<div class="container-main">
			<div class="flex items-center justify-between">
				<!-- Brand -->
				<a href="/">
					<img src="/logo.svg" alt="Dooform Logo" width="155" height="24" />
				</a>

				<!-- Mobile navbar buttons -->
				<div class="flex items-center gap-2 lg:hidden">
					<button
						type="button"
						class="p-2 text-text-default hover:bg-surface-alt rounded-lg"
						title="ค้นหา"
						onclick={() => (isSearchOpen = !isSearchOpen)}
						aria-expanded={isSearchOpen}
					>
						<Search class="w-5 h-5" />
						<span class="sr-only">ค้นหา</span>
					</button>

					<button
						type="button"
						class="p-2 text-text-default hover:bg-surface-alt rounded-lg"
						title="เมนู"
						onclick={() => (isMenuOpen = !isMenuOpen)}
						aria-expanded={isMenuOpen}
					>
						<Menu class="w-5 h-5" />
						<span class="sr-only">เมนู</span>
					</button>
				</div>

				<!-- Tools - Desktop -->
				<div class="hidden lg:flex items-center gap-4">
					<div class="flex items-center gap-2">
						<a
							href="{APP_URL}/register"
							class="px-4 py-2 text-sm font-medium text-text-default border border-border-default rounded-lg hover:bg-surface-alt transition-colors"
						>
							ลงทะเบียน
						</a>
						<a
							href="{APP_URL}/login"
							class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
						>
							เข้าสู่ระบบ
						</a>
					</div>

					<!-- Search bar - Desktop -->
					<div class="flex items-center border border-border-default rounded-full px-3 py-1.5">
						<label class="sr-only" for="search-input">ค้นหา</label>
						<input
							class="text-sm focus:outline-none w-40 bg-transparent"
							placeholder="ค้นหาแบบฟอร์ม"
							id="search-input"
							type="search"
						/>
						<button type="submit" title="ค้นหา" class="text-text-muted hover:text-text-default">
							<Search class="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Search Modal - Mobile -->
	{#if isSearchOpen}
		<div class="lg:hidden bg-background border-t border-border-default">
			<div class="container-main py-4">
				<div class="flex items-center gap-2">
					<div class="flex-1 flex items-center border border-border-default rounded-full px-3 py-2">
						<input
							class="flex-1 text-sm focus:outline-none bg-transparent"
							placeholder="ค้นหาแบบฟอร์ม"
							type="search"
						/>
						<button type="submit" title="ค้นหา" class="text-text-muted">
							<Search class="w-4 h-4" />
						</button>
					</div>
					<button
						type="button"
						class="p-2 text-text-muted hover:bg-surface-alt rounded-lg"
						title="ปิด"
						onclick={() => (isSearchOpen = false)}
					>
						<X class="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Navigation - Desktop -->
	<div class="hidden lg:block border-t border-border-default">
		<div class="container-main">
			<nav aria-label="เมนูหลัก">
				<ul class="flex items-center gap-1">
					{#each navigationItems as item}
						<li>
							<a
								href={item.href}
								class="block px-4 py-3 text-sm font-semibold text-text-default hover:bg-surface-alt rounded-lg transition-colors"
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>
	</div>

	<!-- Mobile Menu Modal -->
	{#if isMenuOpen}
		<!-- Backdrop -->
		<button
			class="lg:hidden fixed inset-0 bg-black/50 z-40"
			onclick={() => (isMenuOpen = false)}
			aria-hidden="true"
		></button>
		<!-- Menu Panel -->
		<div
			class="lg:hidden fixed inset-0 w-full bg-background z-50 overflow-y-auto"
			role="dialog"
			aria-modal="true"
			aria-label="เมนูหลัก"
		>
			<div class="container-main py-4">
				<div class="flex w-full items-center justify-between mb-4">
					<a href="/" onclick={() => (isMenuOpen = false)}>
						<img src="/logo.svg" alt="Dooform Logo" width="155" height="24" />
					</a>
					<button
						type="button"
						class="p-2 text-text-muted hover:bg-surface-alt rounded-lg"
						title="ปิด"
						onclick={() => (isMenuOpen = false)}
					>
						<X class="w-6 h-6" />
						<span class="sr-only">ปิดเมนู</span>
					</button>
				</div>

				<div class="flex gap-2 mb-6">
					<a
						href="{APP_URL}/register"
						class="flex-1 px-4 py-2 text-sm font-medium text-center text-text-default border border-border-default rounded-lg hover:bg-surface-alt transition-colors"
						onclick={() => (isMenuOpen = false)}
					>
						ลงทะเบียน
					</a>
					<a
						href="{APP_URL}/login"
						class="flex-1 px-4 py-2 text-sm font-medium text-center text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
						onclick={() => (isMenuOpen = false)}
					>
						เข้าสู่ระบบ
					</a>
				</div>

				<nav aria-label="เมนูหลัก">
					<ul class="flex flex-col">
						{#each navigationItems as item}
							<li class="border-b border-border-default">
								<a
									href={item.href}
									class="block px-2 py-4 text-sm font-semibold text-text-default"
									onclick={() => (isMenuOpen = false)}
								>
									{item.label}
								</a>
							</li>
						{/each}
					</ul>
				</nav>
			</div>
		</div>
	{/if}
</header>

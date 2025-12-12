<script lang="ts">
	import { Check } from 'lucide-svelte';

	interface Props {
		background?: 'default' | 'alt';
	}

	let { background = 'default' }: Props = $props();

	const bgClass = background === 'alt' ? 'bg-surface-alt' : 'bg-background';

	interface PricingTier {
		name: string;
		description: string;
		price: string;
		priceNote?: string;
		features: string[];
		includesFrom?: string;
		isRecommended?: boolean;
		ctaText: string;
		ctaVariant?: 'primary' | 'secondary';
	}

	const pricingTiers: PricingTier[] = [
		{
			name: 'Free',
			description: 'For individuals getting started',
			price: '0',
			priceNote: 'forever',
			features: [
				'Unlimited forms',
				'100 responses per month',
				'Basic templates',
				'Email support',
				'1 user'
			],
			ctaText: 'Get Started',
			ctaVariant: 'secondary'
		},
		{
			name: 'Pro',
			description: 'Everything you need to get started',
			price: '590',
			priceNote: 'per user / month',
			features: [
				'Unlimited responses',
				'Custom branding',
				'File uploads',
				'Priority email support',
				'Up to 5 users'
			],
			includesFrom: 'Free',
			ctaText: 'Start Free Trial',
			ctaVariant: 'secondary'
		},
		{
			name: 'Premium',
			description: 'Align multiple teams',
			price: '1990',
			priceNote: 'per user / month',
			features: [
				'Advanced analytics',
				'Team collaboration',
				'API access',
				'Custom integrations',
				'Unlimited users',
				'24/7 support'
			],
			includesFrom: 'Standard',
			isRecommended: true,
			ctaText: 'Start Free Trial',
			ctaVariant: 'primary'
		},
		{
			name: 'Enterprise',
			description: 'Advanced security for enterprises',
			price: 'ติดต่อเรา',
			features: [
				'SSO & SAML',
				'Dedicated account manager',
				'SLA guarantees',
				'Custom contracts',
				'On-premise deployment',
				'Audit logs'
			],
			includesFrom: 'Premium',
			ctaText: 'Contact Sales',
			ctaVariant: 'secondary'
		}
	];
</script>

<section class={bgClass}>
	<div class="container-main section-padding">
		<!-- Header -->
		<div class="text-center mb-12">
			<h2 class="text-h2 text-text-default mb-4">เลือกแพ็คเกจใช้งาน</h2>
			<p class="text-body text-text-muted max-w-2xl mx-auto">
				เริ่มทดลองใช้งานได้ฟรี หากต้องการใช้งานมากขึ้น สามารถเลือกแพ็คเกจ
			</p>
		</div>

		<!-- Pricing Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each pricingTiers as tier}
				<div
					class="relative flex flex-col rounded-xl border {tier.isRecommended
						? 'border-primary border-2 shadow-lg'
						: 'border-border-default'} bg-background p-6 transition-all hover:shadow-md"
				>
					<!-- Recommended Badge -->
					{#if tier.isRecommended}
						<div class="absolute -top-3 left-1/2 -translate-x-1/2">
							<span
								class="bg-primary text-white text-caption font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
							>
								Recommended
							</span>
						</div>
					{/if}

					<!-- Tier Header -->
					<div class="mb-6">
						<h3 class="text-h3 text-text-default mb-1">{tier.name}</h3>
						<p class="text-body-sm text-text-muted">{tier.description}</p>
					</div>

					<!-- Price -->
					<div class="mb-6">
						<div class="flex items-baseline gap-1">
							<span class="text-h1 text-text-default">{tier.price}</span>
						</div>
						{#if tier.priceNote}
							<p class="text-body-sm text-text-muted">{tier.priceNote}</p>
						{/if}
					</div>

					<!-- CTA Button -->
					<div class="mb-6">
						<a
							href="#"
							class="block w-full text-center px-4 py-2 text-sm font-medium rounded-lg transition-colors {tier.ctaVariant ===
							'primary'
								? 'text-white bg-primary hover:bg-primary-hover'
								: 'text-text-default border border-border-default hover:bg-surface-alt'}"
						>
							{tier.ctaText}
						</a>
					</div>

					<!-- Divider -->
					<div class="border-t border-border-default mb-6"></div>

					<!-- Features -->
					<div class="flex-1">
						{#if tier.includesFrom}
							<p class="text-body-sm font-semibold text-text-default mb-4">
								Everything from {tier.includesFrom} plus:
							</p>
						{:else}
							<p class="text-body-sm font-semibold text-text-default mb-4">Includes:</p>
						{/if}
						<ul class="space-y-3">
							{#each tier.features as feature}
								<li class="flex items-start gap-3 text-body-sm text-text-default">
									<Check class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
									<span>{feature}</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			{/each}
		</div>

		<!-- Footer Note -->
		<div class="text-center mt-10">
			<p class="text-body-sm text-text-muted">
				ราคาทั้งหมดเป็นราคา THB หากสนใจ
				<a href="#" class="text-primary hover:underline">สามสารถติดต่อได้ที่นี่</a>
			</p>
		</div>
	</div>
</section>

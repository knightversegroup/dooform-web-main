<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';

	interface Props {
		background?: 'default' | 'alt';
	}

	let { background = 'default' }: Props = $props();

	const bgClass = background === 'alt' ? 'bg-surface-alt' : 'bg-background';

	interface FAQItem {
		id: string;
		question: string;
		answer: string;
	}

	const faqItems: FAQItem[] = [
		{
			id: 'faq-1',
			question: 'ระบบออกแบบหรือ Design System คืออะไร?',
			answer:
				'ระบบออกแบบคือชุดของส่วนประกอบที่นำกลับมาใช้ใหม่ได้ มีมาตรฐานและการกำกับดูแลที่ชัดเจน สามารถนำมาประกอบกันเพื่อสร้างเว็บไซต์หลายแห่งได้'
		},
		{
			id: 'faq-2',
			question: 'ใครคือผู้ใช้งานระบบออกแบบ?',
			answer:
				'ระบบออกแบบนี้มุ่งเน้นไปที่นักพัฒนาและนักออกแบบ ไม่ว่าจะเป็นเจ้าหน้าที่ภาครัฐหรือผู้รับเหมาสำหรับเว็บไซต์ของรัฐ'
		},
		{
			id: 'faq-3',
			question: 'ขอบเขตการใช้งานของระบบออกแบบคืออะไร?',
			answer:
				'ระบบออกแบบเป็นมาตรฐานบังคับสำหรับเว็บไซต์ภาครัฐ เชิญชวนให้คุณศึกษาหน้าเฉพาะเพื่อทราบรายละเอียดประเภทเว็บไซต์ที่เกี่ยวข้อง'
		},
		{
			id: 'faq-4',
			question: 'ส่วนประกอบถูกสร้างขึ้นมาอย่างไร?',
			answer:
				'ส่วนประกอบได้รับการพัฒนาโดยทีมงานหลากหลายสาขา ประกอบด้วยนักพัฒนา นักออกแบบ และผู้เชี่ยวชาญด้านการเข้าถึง ส่วนประกอบที่เผยแพร่ได้รับการออกแบบตามมาตรฐานการเข้าถึงและผ่านการทดสอบต่างๆ'
		},
		{
			id: 'faq-5',
			question: 'ทีมงานเบื้องหลังระบบออกแบบคือใคร?',
			answer:
				'ทีมงานระบบออกแบบประกอบด้วยเจ้าหน้าที่ภาครัฐ ผู้เชี่ยวชาญจากภายนอก และสถาบันหลายแห่งที่มีภารกิจและประสบการณ์ด้านดิจิทัล'
		},
		{
			id: 'faq-6',
			question: 'โปรเจกต์ของฉันเพิ่งเริ่มต้นหรือเริ่มไปแล้ว ควรทำอย่างไร?',
			answer:
				'ติดต่อเราเพื่อพูดคุยกัน! คุณจะได้รับการเข้าถึงเอกสาร ส่วนประกอบต่างๆ และสามารถพูดคุยกับทีมงานและผู้ใช้งานคนอื่นๆ ได้'
		}
	];

	let openId = $state<string | null>(null);

	function handleToggle(id: string) {
		openId = openId === id ? null : id;
	}
</script>

<section class={bgClass}>
	<div class="container-main section-padding">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
			<!-- Left side - Title and Link -->
			<div class="lg:col-span-4">
				<h2 class="text-h2 text-foreground mb-4">คำถามที่พบบ่อย</h2>
			</div>

			<!-- Right side - Accordions -->
			<div class="lg:col-span-8">
				{#each faqItems as item}
					<div class="border-b border-border-default">
						<button
							type="button"
							onclick={() => handleToggle(item.id)}
							aria-expanded={openId === item.id}
							class="w-full flex items-center justify-between py-4 text-left text-foreground hover:text-primary transition-colors"
						>
							<span class="text-body font-medium">{item.question}</span>
							<ChevronDown
								class="w-5 h-5 text-text-muted transition-transform duration-200 {openId ===
								item.id
									? 'rotate-180'
									: ''}"
							/>
						</button>
						<div
							class="overflow-hidden transition-all duration-200 {openId === item.id
								? 'max-h-96 pb-4'
								: 'max-h-0'}"
						>
							<p class="text-body-sm text-text-default">{item.answer}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

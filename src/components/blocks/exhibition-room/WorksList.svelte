<!--
	Print-only list of the works shown in a room, per cabinet. The library
	records come from the page load, keyed by lowercased reference.
-->
<script lang="ts">
	import { page } from '$app/stores'
	import type { RoomCabinet } from '$lib/utilities/exhibitionRoom'
	import { language } from '$stores/language'
	import { labelTranslations } from '$stores/translations'

	interface Props {
		cabinets: RoomCabinet[]
	}

	let { cabinets }: Props = $props()

	type Work = Record<string, any>
	type Lang = 'en' | 'ar'

	const credits: Record<string, Work> = $derived($page.data.libraryCredits ?? {})
	const lang = $derived($language as Lang)

	const creditRoles = [
		'coverDesign',
		'coverIllustration',
		'coverCalligraphy',
		'pageDesign',
		'pageIllustration',
		'pageCalligraphy'
	] as const

	/** Each book once, in order of appearance */
	function getCabinetRefs(cabinet: RoomCabinet): string[] {
		const refs = cabinet.groups
			.flatMap((group) => group.images.map((image) => image.reference?.toLowerCase()))
			.filter((ref): ref is string => !!ref && ref in credits)
		return [...new Set(refs)]
	}

	// "Cover design, cover illustration: Kamal Boullata; Page calligraphy: Elias Nicolas"
	function formatRoles(work: Work, lang: Lang): string {
		const byPerson = new Map<string, string[]>()
		for (const role of creditRoles) {
			const person = work[role]?.trim()
			if (!person) continue
			const label = $labelTranslations[role][lang]
			byPerson.set(person, [...(byPerson.get(person) ?? []), label])
		}
		return [...byPerson]
			.map(([person, roles]) => {
				const label = roles
					.map((role, i) => (i && lang === 'en' ? role.toLowerCase() : role))
					.join(lang === 'ar' ? '، ' : ', ')
				return `${label}: ${person}`
			})
			.join(lang === 'ar' ? '؛ ' : '; ')
	}

	function formatPublication(work: Work, lang: Lang): string {
		return [work.publisher, work.place, work.year].filter(Boolean).join(lang === 'ar' ? '، ' : ', ')
	}
</script>

{#if Object.keys(credits).length}
	<section class="print-credits hidden print:block {lang === 'ar' ? 'font-lyon' : 'font-martina'}">
		<h2 class={lang === 'ar' ? 'font-manchette' : 'font-boogy'}>
			{$labelTranslations.listOfWorks[lang]}
		</h2>
		{#each cabinets as cabinet}
			{@const refs = getCabinetRefs(cabinet)}
			{#if refs.length}
				<h3>{lang === 'ar' ? cabinet.nameAr : cabinet.nameEn}</h3>
				<ul>
					{#each refs as ref}
						{@const work = credits[ref]}
						{@const publication = formatPublication(work, lang)}
						{@const roles = formatRoles(work, lang)}
						<li>
							<span class="print-credits-ref">{work.ref}</span>
							<div>
								<p>
									<em>{work.title?.trim()}</em>{#if work.author}. {work.author}{/if}{#if publication}.
										{publication}{/if}
								</p>
								{#if roles}<p>{roles}</p>{/if}
								{#if work.collection}
									<p>{$labelTranslations.collection[lang]}: {work.collection}</p>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		{/each}
	</section>
{/if}

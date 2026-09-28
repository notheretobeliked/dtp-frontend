<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { language } from '$stores/language'
	import { labelTranslations } from '$stores/translations'

	interface Props {
		author?: string | null
		/** Omitted for the home page, which is cited as the site itself */
		title?: string | null
	}

	let { author = null, title = null }: Props = $props()

	const url = $derived(`${$page.data.siteUrl ?? ''}${$page.url.pathname}`)
	const isArabic = $derived($language === 'ar')

	// Pages are prerendered, so the access date is filled in on the client and
	// refreshed when printing starts
	let date = $state('')

	function updateDate() {
		date = new Date().toLocaleDateString(isArabic ? 'ar' : 'en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
	}

	// Built as strings so template whitespace can't drop the spaces. UK style:
	// single quotation marks, comma outside them.
	const lead = $derived.by(() => {
		if (isArabic) return `${author ? `${author}، ` : ''}${title ? `«${title}»، ` : ''}`
		return `${author ? `${author}, ` : ''}${title ? `‘${title}’, ` : ''}`
	})
	const separator = $derived(isArabic ? '، ' : ', ')
	const accessed = $derived(
		date ? ` (${$labelTranslations.accessed[$language]}${isArabic ? ':' : ''} ${date}).` : '.'
	)

	onMount(() => {
		updateDate()
		window.addEventListener('beforeprint', updateDate)
		return () => window.removeEventListener('beforeprint', updateDate)
	})
</script>

<p class="print-citation hidden print:block {isArabic ? 'font-lyon' : 'font-martina'}">
	<span class="print-citation-label">{$labelTranslations.citeAs[$language]}</span>
	{lead}<em>{$labelTranslations.siteName[$language]}</em>{separator}<span dir="ltr">{url}</span>{accessed}
</p>

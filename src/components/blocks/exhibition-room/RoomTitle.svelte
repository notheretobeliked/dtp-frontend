<!--
	The name of a room or cabinet: Arabic first, with the English name under it
	on every page but the Arabic one.
-->
<script lang="ts">
	import CoreHeading from '$components/blocks/CoreHeading.svelte'
	import { language } from '$stores/language'

	interface Props {
		nameAr: string
		nameEn: string
		/** A heading size such as 'xl'; the default heading size when left out */
		fontSize?: string | null
		/** Font of the English name; the default heading font when left out */
		englishFont?: string | null
		/** Extra classes for the Arabic name */
		arabicClass?: string
	}

	let {
		nameAr,
		nameEn,
		fontSize = null,
		englishFont = null,
		arabicClass = '!mb-0'
	}: Props = $props()

	const heading = (content: string, fontFamily: string | null, className = '') => ({
		attributes: {
			content,
			level: 1,
			fontSize,
			textColor: null,
			textAlign: 'center',
			fontFamily,
			className
		}
	})
</script>

{#if nameAr}
	<CoreHeading block={heading(nameAr, 'manchette', arabicClass)} />
{/if}
{#if nameEn && $language !== 'ar'}
	<CoreHeading block={heading(nameEn, englishFont)} />
{/if}

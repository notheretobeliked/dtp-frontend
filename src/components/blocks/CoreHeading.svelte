<script lang="ts">
	import type { CoreHeading } from '$lib/graphql/generated'
	import { classNames } from '$lib/utilities/utilities'
	import { language } from '$stores/language'

	export let block: CoreHeading

	console.log(block)
	const {
		content = '',
		fontSize = 'base',
		textColor = '',
		textAlign = 'left',
		level = 1,
		fontFamily = null,
		className = ''
	} = block.attributes ?? {}
	$: finalAlign = textAlign === 'center' ? 'center' : $language === 'ar' ? 'right' : textAlign
	const isArabic = $language === 'ar'
	
	// Helper function to determine font family based on level and language
	function getFontFamily(level, providedFont) {
		// If font is explicitly specified, use it
		
		if (providedFont) return providedFont;
		
		// Otherwise, use level-specific defaults
		if (level === 1) return isArabic ? 'lyon' : 'boogy';
		if (level === 2) return isArabic ? 'lyon' : 'martina';
		if (level === 3) return isArabic ? 'lyon' : 'martina';
		if (level === 4) return isArabic ? 'manchette-ultralight' : 'martina';
		if (level === 5) return isArabic ? 'lyon' : 'martina';
		
		// Fallback
		return isArabic ? 'lyon' : 'martina';
	}
	console.log(getFontFamily(4, fontFamily))
</script>

{#if level === 1}
	<h1
		class="{classNames(
			fontSize || '2xl',
			textColor || '',
			finalAlign || 'left', // Replace textAlign with finalAlign in all h1-h5 elements
			getFontFamily(1, fontFamily),
			isArabic
		)} {className} mb-1 md:mb-3 lg:mb-4 mx-2 lg:mx-0"
	>
		{@html content}
	</h1>{/if}
{#if level === 2}
	<h2
		class="{classNames(
			fontSize || 'base',
			textColor || '',
			finalAlign || 'left', // Replace textAlign with finalAlign in all h1-h5 elements
			getFontFamily(2, fontFamily),
			isArabic
		)} {className} pb-1 border-b border-black mt-2 md:mt-5 mb-2 md:mb-3 mx-2 lg:mx-0"
	>
		{@html content}
	</h2>
{/if}
{#if level === 3}
	<h3
		class="{classNames(
			fontSize || 'base',
			textColor || '',
			finalAlign || 'left', // Replace textAlign with finalAlign in all h1-h5 elements
			getFontFamily(3, fontFamily),
			isArabic
		)} {className} {$language === 'en' ? 'tracking-wider' : ''} uppercase mt-2 md:mt-5 mb-2 md:mb-3 mx-2 lg:mx-0"
	>
		{@html content}
	</h3>
{/if}

{#if level === 4}
	<h4
		class="{classNames(
			fontSize || 'xs',
			textColor || '',
			finalAlign || 'left', // Replace textAlign with finalAlign in all h1-h5 elements
			getFontFamily(4, fontFamily),
			isArabic
		)} {className} {$language === 'en' ? 'tracking-widest' : ''} uppercase mb-1 mx-2 lg:mx-0"
	>
		{@html content}
	</h4>
{/if}

{#if level === 5}
	<h5
		class="{classNames(
			fontSize || 'xs',
			textColor || '',
			finalAlign || 'left', // Replace textAlign with finalAlign in all h1-h5 elements
			getFontFamily(5, fontFamily),
			isArabic
		)} {className} {$language === 'en' ? 'tracking-widest' : ''} uppercase mb-3 mx-2 lg:mx-0"
	>
		{@html content}
	</h5>
{/if}

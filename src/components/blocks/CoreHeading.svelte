<script lang="ts">
	import type { CoreHeading } from '$lib/graphql/generated'
	import { classNames } from '$lib/utilities/utilities'
	import { language } from '$stores/language'

	// Headings built in code (e.g. ExhibitionRoom) still pass `textAlign`, which
	// WP 7.0 removed from the generated CoreHeading attributes.
	type HeadingAttributes = NonNullable<CoreHeading['attributes']> & {
		textAlign?: string | null
	}
	type HeadingBlock = Omit<CoreHeading, 'attributes'> & { attributes?: HeadingAttributes | null }

	interface Props {
		block: HeadingBlock;
	}

	let { block }: Props = $props();

	const attributes: Partial<HeadingAttributes> = block.attributes ?? {}
	const {
		content = '',
		fontSize = 'base',
		textColor = '',
		level = 1,
		fontFamily = null,
		className = '',
		cssClassName = ''
	} = attributes

	// WP 7.0 removed the `textAlign` attribute from core/heading: alignment now
	// only reaches us as the has-text-align-* class on cssClassName (the rendered
	// class string). Blocks built in code (e.g. ExhibitionRoom) still pass
	// `textAlign` directly, so that wins when present.
	const alignMatch = /has-text-align-(center|right|left)/.exec(`${cssClassName ?? ''} ${className ?? ''}`)
	const textAlign = attributes.textAlign ?? alignMatch?.[1] ?? 'left'

	// Strip the WordPress alignment classes; classNames() emits the Tailwind equivalent.
	const customClassName = (className ?? '').replace(/has-text-align-(center|right|left)/g, '').trim()
	
	// Make these reactive with $derived
	const finalAlign = $derived(textAlign === 'center' ? 'center' : $language === 'ar' ? 'right' : textAlign)
	const isArabic = $derived($language === 'ar')
	
	// Make font family reactive
	const fontFamilyForLevel = $derived(getFontFamily(level, fontFamily))
	
	// Make classes reactive
	const headingClasses = $derived(classNames(
		fontSize || (level === 1 ? '2xl' : level === 4 ? 'xs' : level === 3 ? 'base-lg' : level === 4 ? 'xs' : 'base'),
		textColor || '',
		finalAlign || 'left',
		fontFamilyForLevel,
		isArabic
	))
	
	// Helper function to determine font family based on level and language
	function getFontFamily(level, providedFont) {
		// If font is explicitly specified, use it
		if (providedFont) return providedFont;
		
		// Check if Arabic based on current language state
		const isAr = $language === 'ar';
		
		// Otherwise, use level-specific defaults
		if (level === 1) return isAr ? 'lyon' : 'boogy';
		if (level === 2) return isAr ? 'lyon' : 'martina';
		if (level === 3) return isAr ? 'lyon' : 'martina';
		if (level === 4) return isAr ? 'manchette-ultralight' : 'martina';
		if (level === 5) return isAr ? 'lyon' : 'martina';
		
		// Fallback
		return isAr ? 'lyon' : 'martina';
	}
	
</script>

{#if level === 1}
	<h1
		class="{headingClasses} {customClassName} mb-1 md:mb-3 lg:mb-4 mx-2 lg:mx-0"
	>
		{@html content}
	</h1>{/if}
{#if level === 2}
	<h2
		class="{headingClasses} {customClassName} pb-1 border-b border-black mt-2 md:mt-5 mb-2 md:mb-3 mx-2 lg:mx-0"
	>
		{@html content}
	</h2>
{/if}
{#if level === 3}
	<h3
		class="{headingClasses} {customClassName} {$language === 'en' ? 'tracking-wider' : ''} uppercase mb-2 md:mb-3 mx-2 lg:mx-0"
	>
		{@html content}
	</h3>
{/if}

{#if level === 4}
	<h4
		class="{headingClasses} {customClassName} {$language === 'en' ? 'tracking-widest' : ''} uppercase mb-1 mx-2 lg:mx-0"
	>
		{@html content}
	</h4>
{/if}

{#if level === 5}
	<h5
		class="{headingClasses} {customClassName} {$language === 'en' ? 'tracking-widest' : ''} uppercase mb-3 mx-2 lg:mx-0"
	>
		{@html content}
	</h5>
{/if}

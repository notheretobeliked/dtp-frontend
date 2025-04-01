<script lang="ts">
	import type { CoreParagraph } from '$lib/graphql/generated'
	import { classNames } from '$lib/utilities/utilities'
	import { language } from '$stores/language' 

	interface Props {
		block: CoreParagraph;
	}

	let { block }: Props = $props();

	let isArabic = $derived($language === 'ar')

    const {
        content = '',
        fontSize = 'base',
        textColor = 'black',
        align = 'left',
        fontFamily = null
    } = block.attributes ?? {}

    // Use nullish coalescing to provide a default when null
    const defaultFontFamily = fontFamily ?? 'martina'
    
    
    let finalFontFamily = $derived($language === 'ar' ? 'lyon' : defaultFontFamily)
	
    let finalAlign = $derived($language === 'ar' ? 'right' : align)



</script>

<!-- Use the class directive in Svelte to dynamically set classes -->
{#if content}
	<p
		class="{classNames(
			fontSize || 'base',
			textColor || 'black',
			finalAlign || 'left',
			finalFontFamily || 'martina',
			isArabic
		)} mb-4 mx-2 lg:mx-0"
	>
	{@html content}
</p>

{/if}

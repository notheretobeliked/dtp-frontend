<script lang="ts">
	import type { CoreImage } from '$lib/graphql/generated'
	import Image from '$components/Image.svelte'
	interface Props {
		block: CoreImage;
	}

	let { block }: Props = $props();

	// Create a fallback size using the direct URL if available
	const fallbackSize = {
		name: 'full',
		sourceUrl: block.attributes?.url || '',
		width: '1024',  // default width
		height: '768'   // default height
	}

	// Handle all possible edge cases for sizes
	const sizes = (() => {
		// Case 1: mediaDetails is null
		if (!block.mediaDetails) {
			return [fallbackSize]
		}

		// Case 2: sizes is null or empty
		if (!block.mediaDetails.sizes || !Array.isArray(block.mediaDetails.sizes) || block.mediaDetails.sizes.length === 0) {
			return [fallbackSize]
		}

		// Case 3: sizes exists and has content - use as is
		return block.mediaDetails.sizes
	})()

	const imageObject = {
		altText: block.attributes?.alt ? block.attributes.alt : '',
		mediaDetails: {
			sizes
		}
	}
</script>

<figure class="mb-4 w-full lg:w-3/4 mx-auto">
	<Image {imageObject} imageSize="large" fit="contain" />
    {#if block.attributes?.caption}
        <figcaption class="font-martina text-sm mt-2 text-center">{block.attributes.caption}</figcaption>
    {/if}
</figure>

<script lang="ts">
	import type { CoreImage } from '$lib/graphql/generated'
	import Image from '$components/Image.svelte'
	interface Props {
		block: CoreImage;
	}

	let { block }: Props = $props();

	// The original/full-size image (the backend keeps originals at full
	// resolution). Always offer it as the largest srcset candidate, so images
	// that only generated small subsizes — e.g. wide/short images that never get
	// a `large`/`x_large` variant — still render sharp instead of collapsing to a
	// thumbnail.
	const fullSize =
		block.attributes?.url && block.mediaDetails?.width && block.mediaDetails?.height
			? {
					name: 'full',
					sourceUrl: block.attributes.url,
					width: String(block.mediaDetails.width),
					height: String(block.mediaDetails.height)
				}
			: null

	const generatedSizes =
		block.mediaDetails && Array.isArray(block.mediaDetails.sizes)
			? block.mediaDetails.sizes.filter(Boolean)
			: []

	// Combine generated subsizes with the full original, de-duped by URL.
	const combined = [...generatedSizes, fullSize].filter(
		(size, i, arr) => size && arr.findIndex((other) => other?.sourceUrl === size.sourceUrl) === i
	)

	// Last-ditch fallback so we always have at least one candidate.
	const sizes =
		combined.length > 0
			? combined
			: [{ name: 'full', sourceUrl: block.attributes?.url || '', width: '1024', height: '768' }]

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
        <figcaption class="font-martina text-sm mt-2 text-center">{@html block.attributes.caption}</figcaption>
    {/if}
</figure>

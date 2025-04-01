<script lang="ts">
	import type { ImageSizeData, Maybe } from '$lib/types/generated'
	import { findImageSizeData, getSrcSet } from '$lib/utilities/utilities'

	interface Props {
		imageObject: {
		altText?: Maybe<string>
		mediaDetails: {
			sizes: ImageSizeData[]
		}
	};
		lazy?: boolean;
		imageSize?: keyof ImageSizeData;
		fit?: 'cover' | 'contain' | 'fill' | 'none';
		extraClasses?: string;
		shadow?: boolean;
	}

	let {
		imageObject,
		lazy = true,
		imageSize = 'thumbnail',
		fit = 'none',
		extraClasses = '',
		shadow = false
	}: Props = $props();
	const src = findImageSizeData('sourceUrl', imageObject.mediaDetails.sizes, imageSize)
	const width = findImageSizeData('width', imageObject.mediaDetails.sizes, imageSize)
	const height = findImageSizeData('height', imageObject.mediaDetails.sizes, imageSize)
	const altText = imageObject.altText ?? ''

	function determineSizes(sizeName: ImageSizeName): string {
		switch (sizeName) {
			case 'thumbnail':
				return '(max-width: 600px) 50vw, (max-width: 1200px) 50vw, 25vw'
			case 'medium':
				return '(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw'
			case 'medium_large':
				return '(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw'
			case 'large':
				return '(max-width: 1200px) 100vw, 50vw'
			default:
				return '100vw' // Fallback size for any unhandled cases
		}
	}

	const sizes = determineSizes(imageSize)
</script>
<div class="relative w-full h-full max-w-none flex justify-center">
  <img
    loading={lazy ? 'lazy' : 'eager'}
    class={`${fit === 'contain' ? 'w-auto' : 'w-full'} h-full object-${fit} ${shadow ? 'drop-shadow-lg' : ''} ${extraClasses}`}
    {src}
    alt={altText}
    {width}
    {height}
    srcset={getSrcSet(imageObject.mediaDetails.sizes)}
    {sizes}
  />
  <img 
    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    class="absolute inset-0 w-full h-full"
    alt=""
    {width}
    {height}
  />
</div>

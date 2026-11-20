<script lang="ts">
  /*
    This component ingests an object containing the data from YoastSeO and outputs twitter specific Opengraph tags
  */
  import type { ImageObject } from '$lib/types/wp-types'

  interface ImageSize {
    name: string;
    sourceUrl: string;
    width: number;
    height: number;
    mimeType?: string;
  }

  interface Props {
    image: ImageObject | undefined | null;
    metadescription: string;
    pageTitle: string;
    siteUrl: string;
    /** The page's own full address */
    pageUrl: string;
    imageAlt?: string;
    /** 'summary' shows a small square image beside the text; 'summary_large_image' a wide one above it */
    card?: 'summary' | 'summary_large_image';
  }

  let {
    image,
    metadescription,
    pageTitle,
    siteUrl,
    pageUrl,
    imageAlt = 'Decolonizing the page',
    card = 'summary_large_image'
  }: Props = $props();

  // Helper function to select an image size, defaults to 'large' or the first available size
  function selectImageSize(sizes: ImageSize[], preferredSize = 'large') {
    return sizes.find(size => size.name === preferredSize) || sizes[0]
  }

  // Use optional chaining (?) and nullish coalescing (??) operators to safely access properties
  let imageUrl = $derived(image ?
    (image.mediaDetails?.sizes ?
      selectImageSize(image.mediaDetails.sizes).sourceUrl :
      (image as any).attributes?.url) ?? undefined
    : undefined)
  
  // Fallback image with full site URL
  let fallbackImageUrl = $derived(`${siteUrl}/decolonizingthepage.jpg`)
</script>

<svelte:head>
  <meta name="twitter:card" content={card} />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={metadescription} />
  <meta name="twitter:url" content={pageUrl} />
  <meta name="twitter:image" content={imageUrl || fallbackImageUrl} />
  <meta name="twitter:image:alt" content={imageAlt} />
</svelte:head>

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
  }

  let {
    image,
    metadescription,
    pageTitle,
    siteUrl
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
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={metadescription} />
  <meta name="twitter:url" content={siteUrl} />
  <meta name="twitter:image" content={imageUrl || fallbackImageUrl} />
  <meta name="twitter:image:alt" content={image?.altText || 'Decolonizing the page'} />
</svelte:head>

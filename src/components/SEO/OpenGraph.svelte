<script lang="ts">
  /*
    This component ingests an object containing the data from YoastSeO and outputs meta and Opengraph tags
  */
  import type { LanguageAlternate } from '$lib/utilities/alternates'
  import type { ImageObject } from '$lib/types/wp-types'

  interface ImageSize {
    name: string;
    sourceUrl: string;
    width: number;
    height: number;
    mimeType?: string;
  }

  interface Props {
    // Mark image and squareImage as optional using ? after the type
    image: ImageObject | undefined | null;
    metadescription: string;
    ogLanguage?: string;
    pageTitle: string;
    siteTitle?: string;
    siteUrl: string;
    /** The page's own full address */
    pageUrl: string;
    imageAlt?: string;
    /** The page in each language, where it exists in both; paths without the site's address */
    alternates?: LanguageAlternate[];
  }

  let {
    image,
    metadescription,
    ogLanguage = 'en_GB',
    pageTitle,
    siteTitle = 'Decolonizing the page',
    siteUrl,
    pageUrl,
    imageAlt = 'Decolonizing the page',
    alternates = []
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
  <title>{pageTitle}</title>
  <meta name="msapplication-TileColor" content="#da532c">
  <meta name="theme-color" content="#ffffff">
  <meta name="description" content={metadescription} />
  <meta property="og:site_name" content={siteTitle} />
  <meta property="og:locale" content={ogLanguage} />
  <link rel="canonical" href={pageUrl} />
  {#each alternates as { hreflang, path }}
    <link rel="alternate" {hreflang} href="{siteUrl}{path}" />
  {/each}
  <meta property="og:url" content={pageUrl} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={metadescription} />
  <meta property="og:image" content={imageUrl || fallbackImageUrl} />
  <meta property="og:image:alt" content={imageAlt} />
</svelte:head>

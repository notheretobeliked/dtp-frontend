<!--
	An exhibition room (the `acf/exhibition-room` block): a long page of book
	images, arranged in cabinets, with the room's texts in a side panel.

	Each cabinet holds groups of images, and each group has one of four layouts:
	  miniatures  a wrapping row of small covers
	  centered    one large image per row
	  organic     a loose pile: a book's cover with its spreads staggered below
	  animation   images shown one after another in the same spot

	All image sizes are set in CSS from the aspect ratios in the data, so the
	page keeps its shape while the images load. Clicking an image opens the
	book's library record.
-->
<script lang="ts">
	import { inview } from 'svelte-inview'
	import type { AcfExhibitionRoom } from '$lib/graphql/generated'
	import { buildRoom, cabinetImagesId, type RoomImage } from '$lib/utilities/exhibitionRoom'
	import { activeBook } from '$stores/activeBook'
	import { language } from '$stores/language'
	import AnimationGroup from './exhibition-room/AnimationGroup.svelte'
	import InfoPanel from './exhibition-room/InfoPanel.svelte'
	import RoomTitle from './exhibition-room/RoomTitle.svelte'
	import WorksList from './exhibition-room/WorksList.svelte'

	interface Props {
		block: AcfExhibitionRoom
	}

	let { block }: Props = $props()

	const room = $derived(buildRoom(block.exhibitionRoom))
	const isArabic = $derived($language === 'ar')

	// The cabinet currently on screen (its slug), or null at the top of the
	// room. The info panel scrolls its text to match.
	let activeCabinet = $state<string | null>(null)

	// Loading bar: fills up while the first few images arrive, then goes away.
	const LOADING_BAR_IMAGES = 8
	let settledImages = $state(0)
	const awaitedImages = $derived(
		Math.min(room.cabinets[0]?.groups[0]?.images.length ?? 0, LOADING_BAR_IMAGES)
	)
	const loadingProgress = $derived(awaitedImages ? Math.min(settledImages / awaitedImages, 1) : 1)

	/** Counts the images inside `node` that have loaded. Failed ones count too, so the bar can't get stuck. */
	function countSettledImages(node: HTMLElement) {
		settledImages = [...node.querySelectorAll('img')].filter((img) => img.complete).length
		const onSettled = () => (settledImages += 1)

		// `load` and `error` don't bubble, so listen in the capture phase
		node.addEventListener('load', onSettled, true)
		node.addEventListener('error', onSettled, true)

		return {
			destroy() {
				node.removeEventListener('load', onSettled, true)
				node.removeEventListener('error', onSettled, true)
			}
		}
	}

	/** Keeps an image transparent until it has arrived, so that it fades in. */
	function fadeInWhenLoaded(img: HTMLImageElement) {
		if (img.complete) return

		img.style.opacity = '0'
		const show = () => (img.style.opacity = '')
		img.addEventListener('load', show, { once: true })
		img.addEventListener('error', show, { once: true })
	}

	interface Placement {
		column: 'both' | 'left' | 'right'
		row: number
	}

	/**
	 * Where an image sits in an organic group on wide screens. The first image
	 * is centred, the following ones alternate left and right of the centre
	 * line (mirrored on Arabic pages), each starting half an image lower than
	 * the one before. From four images up, the last one is centred again.
	 */
	function organicPlacement(index: number, count: number): Placement {
		const isStaggered = count > 2
		const isClosing = count > 3 && index === count - 1

		if (!isStaggered || index === 0) return { column: 'both', row: index + 1 }
		// Staggered images span two rows, so the closing image starts two rows down
		if (isClosing) return { column: 'both', row: index + 2 }
		return { column: index % 2 ? 'left' : 'right', row: index + 1 }
	}
</script>

{#snippet tile(image: RoomImage, shadow: boolean, placement?: Placement)}
	<button
		type="button"
		class="tile {placement?.column ?? ''}"
		style:--aspect-ratio={image.aspectRatio}
		style:--row={placement?.row}
		disabled={!image.reference}
		onclick={() => ($activeBook = image.reference)}
	>
		<img
			class="h-full w-full transition-opacity duration-300"
			class:drop-shadow-lg={shadow}
			use:fadeInWhenLoaded
			src={image.src}
			srcset={image.srcset}
			width={image.width}
			height={image.height}
			alt={image.alt}
			loading="lazy"
		/>
		{#if image.reference}
			<span class="print-ref hidden print:block">{image.reference}</span>
		{/if}
	</button>
{/snippet}

{#if loadingProgress < 1}
	<div class="fixed top-0 left-0 w-full h-1 z-50 print:hidden">
		<div
			class="h-full bg-black transition-all duration-300"
			style:width="{loadingProgress * 100}%"
		></div>
	</div>
{/if}

<div class="images w-full" use:countSettledImages>
	<header
		class="my-[200px] print:my-0"
		use:inview={{ rootMargin: '0px 0px -80% 0px' }}
		oninview_enter={() => (activeCabinet = null)}
	>
		<RoomTitle nameAr={room.nameAr} nameEn={room.nameEn} fontSize="4xl" />
		{#if room.introText}
			<div class="hidden print:block basestyles introtext" class:ar={isArabic}>
				{@html room.introText}
			</div>
		{/if}
	</header>

	{#each room.cabinets as cabinet}
		<div
			class="mb-8"
			id={cabinetImagesId(cabinet.slug)}
			use:inview={{ rootMargin: '-20% 0px -60% 0px' }}
			oninview_enter={() => (activeCabinet = cabinet.slug)}
		>
			<header class="mb-12">
				<RoomTitle nameAr={cabinet.nameAr} nameEn={cabinet.nameEn} englishFont="boogy" />
			</header>

			{#if cabinet.introText}
				<div class="hidden print:block basestyles" class:ar={isArabic}>
					{@html cabinet.introText}
				</div>
			{/if}

			{#each cabinet.groups as group}
				{#if group.layout === 'animation'}
					<AnimationGroup {group} />
				{:else}
					<div
						class="image-group layout-{group.layout}"
						style:--widest-aspect-ratio={group.widestAspectRatio}
					>
						{#each group.images as image, i}
							{@render tile(
								image,
								group.shadow,
								group.layout === 'organic' ? organicPlacement(i, group.images.length) : undefined
							)}
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	{/each}

	<WorksList cabinets={room.cabinets} />
</div>

<InfoPanel {room} {activeCabinet} />

<style lang="postcss">
	/* Images are sized from two custom properties set in the markup:
	   --aspect-ratio on each tile and --widest-aspect-ratio on its group. */
	.image-group {
		--max-height: 300px;
		margin-bottom: 200px;
	}

	.tile {
		display: block;
		aspect-ratio: var(--aspect-ratio);
		transition: transform 200ms;
	}

	.tile:enabled:hover {
		transform: scale(1.01);
	}

	/* Miniatures: fixed width, as many to a row as fit */
	.layout-miniatures {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.layout-miniatures .tile {
		width: 180px;
		transition-duration: 500ms;
	}

	.layout-miniatures .tile:enabled:hover {
		transform: scale(1.05);
	}

	/* Centered: each image as tall as allowed, unless that makes it wider than the page */
	.layout-centered {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 200px;
		margin-bottom: 100px;
	}

	.layout-centered .tile {
		width: min(100%, var(--max-height) * var(--aspect-ratio));
	}

	/* Organic: the design constrains images by width. The widest image of a
	   group gets that width and the others share its height, so a book's cover
	   stays in scale with its spreads. --max-height keeps groups of narrow
	   images from growing too tall. The width is the full page here and one of
	   two columns on wide screens. */
	.layout-organic {
		--max-width: 100cqw;
		container-type: inline-size;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
	}

	.layout-organic .tile {
		height: min(var(--max-height), var(--max-width) / var(--widest-aspect-ratio));
	}

	@media (min-width: theme('screens.lg')) {
		.image-group {
			--max-height: 430px;
		}

		.layout-centered {
			margin-bottom: 200px;
		}

		.layout-organic {
			--column-gap: 1rem;
			--max-width: calc(50cqw - var(--column-gap) / 2);
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 2rem var(--column-gap);
		}

		/* See organicPlacement() */
		.layout-organic .tile {
			grid-column: 1 / -1;
			grid-row: var(--row);
			justify-self: center;
		}

		.layout-organic .tile:is(.left, .right) {
			grid-row: var(--row) / span 2;
		}

		/* Left and right images hug the centre line */
		.layout-organic .tile.left {
			grid-column: 1;
			justify-self: end;
		}

		.layout-organic .tile.right {
			grid-column: 2;
			justify-self: start;
		}
	}

	:global(.basestyles p) {
		@apply text-sm md:text-base font-martina;
	}

	:global(.basestyles.introtext p) {
		@apply md:text-[1.2rem];
	}

	:global(.basestyles.ar p) {
		@apply text-ar-sm md:text-ar-base font-lyon text-right;
	}

	:global(.basestyles.ar.introtext p) {
		@apply md:text-[1.3rem];
	}
</style>

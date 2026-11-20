<!--
	Flips through a group's images in place, like a stop-motion film. All frames
	are stacked in one box and only their opacity changes. In print the frames
	are laid out side by side instead (see print.css).
-->
<script lang="ts">
	import { inview } from 'svelte-inview'
	import type { RoomGroup } from '$lib/utilities/exhibitionRoom'
	import { activeBook } from '$stores/activeBook'

	interface Props {
		group: RoomGroup
	}

	let { group }: Props = $props()

	const FRAME_DURATION = 2000

	let current = $state(0)
	// Stays visible underneath while the current frame fades in over it
	let previous = $state(0)
	let isOnScreen = $state(false)

	const references = $derived([
		...new Set(group.images.map((image) => image.reference).filter(Boolean))
	])

	$effect(() => {
		if (!isOnScreen) return

		const timer = setInterval(() => {
			previous = current
			current = (current + 1) % group.images.length
		}, FRAME_DURATION)

		return () => clearInterval(timer)
	})
</script>

<button
	type="button"
	class="layout-animation relative mx-auto my-[200px] block h-[300px] w-full lg:h-[430px] lg:max-w-[800px]"
	use:inview
	oninview_change={({ detail }) => (isOnScreen = detail.inView)}
	onclick={() => ($activeBook = group.images[current].reference)}
>
	{#each group.images as image, i}
		<img
			class="animation-frame absolute inset-0 m-auto h-full w-auto max-w-full object-contain"
			class:current={i === current}
			class:previous={i === previous}
			src={image.src}
			width={image.width}
			height={image.height}
			alt={image.alt}
			loading="lazy"
		/>
	{/each}
	<span class="print-ref hidden print:block">{references.join(', ')}</span>
</button>

<style>
	/* Pointer events are off so the frames can't be saved from the page; see
	   the tiles in ExhibitionRoom.svelte */
	.animation-frame {
		opacity: 0;
		pointer-events: none;
		-webkit-touch-callout: none;
	}

	.animation-frame.previous {
		opacity: 1;
	}

	.animation-frame.current {
		z-index: 1;
		opacity: 1;
		transition: opacity 200ms;
	}
</style>

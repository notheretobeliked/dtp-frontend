<!--
	The side panel with the room's texts: its introduction, then one section per
	cabinet. It slides in from the right and scrolls along with the images.
-->
<script lang="ts">
	import { fly } from 'svelte/transition'
	import { cabinetImagesId, type Room, type RoomCabinet } from '$lib/utilities/exhibitionRoom'
	import { isInfoOpen } from '$stores/infoPanel'
	import { language } from '$stores/language'
	import RoomTitle from './RoomTitle.svelte'

	interface Props {
		room: Room
		/** Slug of the cabinet whose images are on screen, or null at the top of the room */
		activeCabinet: string | null
	}

	let { room, activeCabinet }: Props = $props()

	const INTRO_ID = 'room-intro'
	const cabinetTextId = (slug: string) => `text-cabinet-${slug}`

	const isArabic = $derived($language === 'ar')
	const activeSectionId = $derived(activeCabinet ? cabinetTextId(activeCabinet) : INTRO_ID)

	// Keep the text in step with the images: both while the reader scrolls
	// through the room and when the panel is opened part-way down.
	$effect(() => {
		if ($isInfoOpen) {
			document.getElementById(activeSectionId)?.scrollIntoView({ behavior: 'smooth' })
		}
	})

	/** Scrolls the page to a cabinet's images, or back to the top of the room. */
	function showImages(event: MouseEvent, cabinet?: RoomCabinet) {
		event.preventDefault()
		if (cabinet) {
			document.getElementById(cabinetImagesId(cabinet.slug))?.scrollIntoView({ behavior: 'smooth' })
		} else {
			window.scrollTo({ top: 0, behavior: 'smooth' })
		}
	}
</script>

<!-- A cross while the panel is open, turned into a plus while it is closed -->
{#snippet toggleButton(positionClass: string)}
	<button
		type="button"
		class="{positionClass} top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white-pure rounded-full border border-black flex items-center justify-center hover:scale-105 transition-all duration-300"
		onclick={isInfoOpen.toggle}
	>
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="transition-transform duration-300"
			class:rotate-45={!$isInfoOpen}
		>
			<path d="M1 1L13 13M1 13L13 1" stroke="black" stroke-width="1" />
		</svg>
	</button>
{/snippet}

{#if $isInfoOpen}
	<div
		transition:fly={{ x: 500, duration: 800 }}
		class="fixed right-0 top-0 max-w-[500px] z-30 print:hidden"
		class:dir-rtl={isArabic}
	>
		{@render toggleButton('absolute left-0 z-30')}

		<div class="bg-white-off pt-[100px] px-12 overflow-y-scroll h-screen">
			<div class="pt-16" id={INTRO_ID}>
				<a href="#" onclick={(event) => showImages(event)}>
					<RoomTitle
						nameAr={room.nameAr}
						nameEn={room.nameEn}
						arabicClass={isArabic ? 'mb-4' : '!mb-0'}
					/>
				</a>
				{#if room.introText}
					<div class="basestyles introtext" class:ar={isArabic}>
						{@html room.introText}
					</div>
				{/if}
			</div>

			{#each room.cabinets as cabinet, i}
				<div
					class="mt-8 pt-24 pb-24"
					class:min-h-screen={i === room.cabinets.length - 1}
					id={cabinetTextId(cabinet.slug)}
				>
					<header>
						<a
							href="#{cabinetImagesId(cabinet.slug)}"
							onclick={(event) => showImages(event, cabinet)}
						>
							<RoomTitle
								nameAr={cabinet.nameAr}
								nameEn={cabinet.nameEn}
								fontSize="xl"
								arabicClass={isArabic ? 'mb-2' : '!mb-0'}
							/>
						</a>
					</header>

					{#if cabinet.introText}
						<div class="basestyles" class:ar={isArabic}>
							{@html cabinet.introText}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{:else}
	<div transition:fly={{ x: 500, duration: 500 }} class="print:hidden">
		{@render toggleButton('fixed right-0')}
	</div>
{/if}

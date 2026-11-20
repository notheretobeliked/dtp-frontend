<!--
	One book from the library, at its permanent address (/en/library/a006).
	These addresses are cited elsewhere, so the page shows the book itself, and
	offers the way into the library from there: the link back, and the names
	and year in the label, which lead to the library filtered by them.
-->
<script lang="ts">
	import { afterNavigate } from '$app/navigation'
	import Label from '$components/molecules/label.svelte'
	import { libraryPath } from '$lib/utilities/library'
	import { labelTranslations } from '$stores/translations'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	const book = $derived(data.book)
	const lang = $derived(data.language)
	const isArabic = $derived(lang === 'ar')

	// Where the book sits in the full list
	const placeInLibrary = $derived(libraryPath(lang, {}, { ref: book.ref }))

	// A reader who came from the library goes back to it as they left it, with
	// their filters and their place in the list. Anyone else (following a
	// citation, say) is taken to the book's place in the full list.
	let cameFromLibrary = $state(false)

	afterNavigate(({ from }) => {
		cameFromLibrary = from?.route.id === '/[lang]/library'
	})

	function backToLibrary(event: MouseEvent) {
		const opensElsewhere = event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0
		if (!cameFromLibrary || opensElsewhere) return

		event.preventDefault()
		history.back()
	}
</script>

<main class="py-24 w-full min-h-screen bg-black text-white-pure" class:main-ar={isArabic}>
	<div class="mx-auto max-w-screen-xl font-martina">
		<header class="mb-8">
			<a class="block" href={placeInLibrary} onclick={backToLibrary}>
				<h1 class="text-center text-2xl !font-manchette">مكتبة</h1>
				{#if !isArabic}<h1 class="text-center text-2xl !font-boogy">Library</h1>{/if}
			</a>
		</header>

		<!-- The label works out its contents once, so a new one is made for each book and language -->
		{#key `${lang}/${book.ref}`}
			<div class="py-4 border-y border-white" class:text-right={isArabic}>
				<Label {book} {lang} imagesOpen />
			</div>
		{/key}

		<p class="mt-8 text-center {isArabic ? 'text-ar-sm font-lyon' : 'text-sm'}">
			<a class="underline" href={placeInLibrary} onclick={backToLibrary}>
				{$labelTranslations.viewInLibrary[lang]}
			</a>
		</p>
	</div>
</main>

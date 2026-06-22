<script lang="ts">
	import { createBubbler, stopPropagation } from 'svelte/legacy'

	const bubble = createBubbler()
	import '../app.css'
	import { page, navigating } from '$app/stores'
	import type { LayoutData } from './$types'
	import Twitter from '$components/SEO/Twitter.svelte'
	import OpenGraph from '$components/SEO/OpenGraph.svelte'
	import Header from '$components/Header.svelte'
	import LoadingSpinner from '$components/atoms/LoadingSpinner.svelte'
	import Label from '$components/molecules/label.svelte'
	import { slide } from 'svelte/transition'
	import { activeBook } from '$stores/activeBook'
	import { language } from '$stores/language'
	import { afterNavigate } from '$app/navigation'
	import { onMount } from 'svelte'

	interface Props {
		data: LayoutData
		children?: import('svelte').Snippet<[any]>
	}

	let { data, children }: Props = $props()
	let { seo, menu, uri, siteUrl } = data
	const menuItems = menu?.menuItems?.nodes
	const image = seo.opengraphImage
	const metadescription = seo.metaDesc
	const pageTitle = seo.title
	const siteTitle = seo.opengraphSiteName // Assuming this is used for og:site_name
	let loading = $state(false)
	afterNavigate(() => {
		document.documentElement.lang = $language
		// Close the book label on any real navigation (e.g. following the permalink
		// inside the popover to the library page). Opening the label uses
		// preventDefault and never navigates, so this only fires when we genuinely
		// leave the page — exactly when the popover should get out of the way.
		if (showModal) {
			showModal = false
			$activeBook = null
		}
	})

	let showModal = $state(false)
	let currentBook: string | null = $state(null)

	// Watch the activeBook store and find the matching book from page data
	$effect(() => {
		if ($activeBook) {
			showModal = true
			loading = true
			fetch(`/api/library-items?ref=${$activeBook}&lang=${$language}`)
				.then((res) => res.json())
				.then((data) => {
					currentBook = data || null
					loading = false
				})
				.catch((error) => {
					console.error('Error fetching book:', error)
					currentBook = null
					loading = false
				})
		}
	})

	function closeModal() {
		showModal = false
		$activeBook = null
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal()
		}
	}

	// Matches /<lang>/library/<ref> (optional trailing slash), e.g. /en/library/a035
	const LIBRARY_REF_PATTERN = /^\/[^/]+\/library\/([^/?#]+)\/?$/

	// Intercept clicks on any link to a library reference (in post content,
	// CoreImage figcaptions, etc.) and open the book label instead of navigating.
	// Runs in the capture phase (see onMount) so it fires before SvelteKit's own
	// router intercepts same-origin internal links. `anchor.pathname` strips the
	// host, so this matches both relative (/en/library/a035) and absolute
	// (https://www.decolonizingthepage.com/en/library/a035) hrefs.
	function handleGlobalClick(event: MouseEvent) {
		// Let the browser handle modified clicks (new tab/window, etc.)
		if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return
		}

		const anchor = (event.target as Element | null)?.closest?.('a')
		if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
			return
		}

		// Only convert links inside post content (figcaptions, paragraphs, etc.).
		// Links elsewhere — notably the permalink inside the <Label> popover — must
		// navigate to the library page as normal.
		if (!anchor.closest('[data-post-content]')) {
			return
		}

		const match = anchor.pathname.match(LIBRARY_REF_PATTERN)
		if (!match) return

		event.preventDefault()
		event.stopPropagation()
		$activeBook = decodeURIComponent(match[1])
	}

	onMount(() => {
		// Capture phase: run before SvelteKit's router and any bubble-phase handlers.
		window.addEventListener('click', handleGlobalClick, true)
		return () => window.removeEventListener('click', handleGlobalClick, true)
	})

	$effect(() => {
		$language = $page.params.lang || 'en'
	})
</script>

{#key $page.url.pathname}
	<OpenGraph {image} {metadescription} {pageTitle} {siteTitle} {siteUrl} />
	<Twitter {image} {metadescription} {pageTitle} {siteUrl} />
{/key}

{#key $page.url.pathname}
	<Header />
{/key}

{#if $navigating}
	<div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
		<LoadingSpinner />
	</div>
{/if}

<main class="md:px-0">
	{@render children?.({ data })}
</main>

<!-- Add this at the bottom of your template -->
{#if showModal}
	<div
		class="fixed inset-0 z-50"
		onclick={closeModal}
		onkeydown={handleKeydown}
		role="button"
		tabindex="0"
		aria-label="Close modal"
	>
		<div
			class="fixed bottom-0 bg-black w-full z-50 flex items-center justify-center p-4"
			transition:slide={{ duration: 300, axis: 'y' }}
			onclick={stopPropagation(bubble('click'))}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
			aria-modal="true"
		>
			<div
				class="text-white-pure mx-auto max-w-screen-xl w-full max-h-[90vh] overflow-y-auto relative lg:overflow-y-visible"
				onclick={stopPropagation(bubble('click'))}
				onkeydown={(e) => e.stopPropagation()}
				role="presentation"
			>
				<div
					class="flex justify-end mb-4 w-full lg:absolute lg:translate-x-6 lg:pointer-events-none"
				>
					<button
						class="text-gray-500 hover:text-gray-700 pointer-events-auto"
						onclick={closeModal}
						aria-label="Close modal"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				{#if loading}
					<LoadingSpinner />
				{:else if currentBook}
					<Label book={currentBook} lang={$language} />
				{/if}
			</div>
		</div>
	</div>
{/if}

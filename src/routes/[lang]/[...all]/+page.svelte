<script lang="ts">
	import { run } from 'svelte/legacy';

	import { onMount } from 'svelte'
	import type { EditorBlock } from '$lib/types/wp-types'
	import BlockRenderer from '$components/BlockRenderer.svelte'
	import PostsHeader from '$components/atoms/PostsHeader.svelte'
	import Button from '$components/Button.svelte'
	import { language } from '$stores/language'
	import { labelTranslations } from '$stores/translations'
	import type { PageData } from './$types'
	import { slide } from 'svelte/transition'
	import LoadingSpinner from '$components/atoms/LoadingSpinner.svelte'
	import { setupPrint } from '$lib/utilities/print'
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let editorBlocks: EditorBlock[] = $state(),
		uri: string = $state(),
		isLearningHubSingle: boolean = $state(false)
	let bgColour: string = $state()
	let bgColourClass: string = $state()

	let showFullContent = false
	let visibleBlocks = $state()
	let hiddenBlocks = $state()
	let headerHeight: number

	function getBgColorClass(color: string | null): string {
		return color ? `bg-${color}` : 'bg-white-off'
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString)
		return date
			.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric'
			})
			.replace(/\//g, '.')
	}

	let selectedCategory: string | null = $state(null)


	// Handle category selection
	function handleCategorySelect(category: string | null) {
		selectedCategory = category
	}

	let isHomePage: boolean = $state(false)
	let isExhibitionRoom = $derived(editorBlocks?.some((block) => block.name === 'acf/exhibition-room') ?? false)

	let postContent: HTMLElement | undefined = $state()
	let preparingPrint = $state(false)

	$effect(() => {
		if (!postContent || !(isLearningHubSingle || isExhibitionRoom)) return
		return setupPrint(postContent, (preparing) => (preparingPrint = preparing))
	})


	function handleReadMore() {
		showFullContent = !showFullContent
	}

	let isHovering = false
	run(() => {
		;({ editorBlocks, uri, isLearningHubSingle } = data)
		isHomePage = uri === '/' || uri === '/en' || uri === '/ar'
	});
	run(() => {
		bgColour = data.data.nodeByUri?.pageDesign?.bgColour?.slug || 'white-off'
		bgColourClass = getBgColorClass(bgColour)
		const readMoreIndex = editorBlocks?.findIndex((block) => block.name === 'core/read-more')
		visibleBlocks = readMoreIndex === -1 ? editorBlocks : editorBlocks.slice(0, readMoreIndex)

		hiddenBlocks = readMoreIndex === -1 ? [] : editorBlocks.slice(readMoreIndex + 1)
	});
	// Create a reactive filtered posts array
	let filteredPosts = $derived(selectedCategory
		? data.learningHubPosts.filter((post) => post.category === selectedCategory)
		: data.learningHubPosts)
</script>

<div
	bind:this={postContent}
	data-post-content
	class="{isHomePage ? 'pt-[56px] pb-0' : 'pt-24'} min-h-screen {bgColourClass} {isHomePage
		? 'homepage'
		: ''} {$language === 'ar' ? 'dir-rtl' : ''} {isLearningHubSingle ? 'print-article' : ''} {isExhibitionRoom ? 'print-exhibition' : ''}"
>
	{#if isLearningHubSingle || isExhibitionRoom}
		<div class="hidden print:flex justify-between items-baseline text-black pb-2 mb-8 border-b border-black" dir="ltr">
			<span class="font-boogy text-base">Decolonizing the page</span>
			<span class="font-manchette font-extrabold text-base">جماليّات التحرّر</span>
		</div>
		<p class="print-incomplete-note hidden">{$labelTranslations.printIncomplete[$language]}</p>
	{/if}

	{#if preparingPrint}
		<div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 print:hidden">
			<LoadingSpinner />
		</div>
	{/if}

	{#if isLearningHubSingle}
		<div class="w-full max-w-screen-md mx-auto !px-0">
			<div class="w-full mb-3 h-5 flex content-center print:hidden">
				<div class="w-full mb-3">
					<a
						class="cursor-pointer {$language === 'en'
							? 'font-martina '
							: 'font-lyon'} text-base text-center w-full block mb-3"
						href="/{data.lang}/{data.learningHubSlug}"
					>
						{$labelTranslations.learninghub[$language]}
					</a>
				</div>
			</div>
			<PostsHeader
				byline={data.data.nodeByUri.learningHubFields.byline}
				title={data.data.nodeByUri.title}
				date={formatDate(data.data.nodeByUri.date)}
			/>
		</div>
	{/if}

	{#each editorBlocks as block, index (block.clientId)}
		<BlockRenderer {block} />
	{/each}

	<div class="w-full max-w-screen-md mx-auto">
		{#if data.learningHubCategories}
			<div class="px-2 md:px-0 flex flex-row gap-2">
				{#each data.learningHubCategories as category}
					<div class="flex-1">
						<Button
							label={category.name}
							fullWidth
							active={selectedCategory === category.name}
							on:click={() => handleCategorySelect(category.name)}
							url="#"
						/>
					</div>
				{/each}

				<div class="flex-1">
					<Button
						label={$labelTranslations.all[$language]}
						active={selectedCategory === null}
						fullWidth
						on:click={() => handleCategorySelect(null)}
						url="#"
					/>
				</div>
			</div>
		{/if}
		{#if data.learningHubPosts}
			<div class="mt-10 post-list">
				{#each filteredPosts as post}
					<PostsHeader {...post} />
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.corecolumns) {
		direction: inherit;
	}

	:global(:where(.homepage) .corecolumns) {
		direction: ltr !important;
	}
</style>

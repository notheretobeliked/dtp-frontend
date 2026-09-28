<script lang="ts">
	import { isExpandedStore } from '$stores/expandedStore'
	import Button from './Button.svelte'
	import BlockRenderer from './BlockRenderer.svelte'
	import type { EditorBlock } from '$lib/graphql/generated'
	import { labelTranslations } from '$stores/translations'
	import { language } from '$stores/language'

	interface Props {
		block: EditorBlock;
	}

	let { block }: Props = $props();
	let showFullContent = $state(false)

	function toggleContent() {
		showFullContent = !showFullContent
		$isExpandedStore = showFullContent
		
		if (showFullContent) {
			// Wait for content to render before scrolling
			setTimeout(() => {
				document.getElementById('more')?.scrollIntoView({ 
					behavior: 'smooth',
					block: 'start'
				})
			}, 100)
		}
	}
</script>

<div>
	<div class="flex justify-center mt-8 mb-8 print:hidden">
		<button 
			onclick={toggleContent}
			onkeydown={(e) => e.key === 'Enter' && toggleContent()}
			type="button"
		>
			<Button
				label={showFullContent
					? $labelTranslations.showless[$language]
					: $labelTranslations.readmore[$language]}
				active={showFullContent}
				url="#"
			/>
		</button>
	</div>
	<!-- Always rendered so the full text prints; hidden on screen until expanded -->
	<div class="content-wrapper" id="more">
		<div class="pb-12 print:block" class:hidden={!showFullContent}>
			{#each block.children as childBlock}
				<BlockRenderer block={childBlock} />
			{/each}
		</div>
	</div>
</div>


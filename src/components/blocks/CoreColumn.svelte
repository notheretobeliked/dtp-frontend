<script lang="ts">
	export let block: EditorBlock
	import BlockRenderer from '$components/BlockRenderer.svelte'
	import { classNames } from '$lib/utilities/utilities'
	console.log(block)
</script>

<div class="w-full pb-6 lg:pb-0 {block.attributes?.className}">
		{#each block.children as block, index}
			<BlockRenderer {block} />
		{/each}
</div>

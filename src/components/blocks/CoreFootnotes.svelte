<script lang="ts">
	import type { CoreFootnotes } from '$lib/graphql/generated'
	export let block: CoreFootnotes
</script>

{#if block.renderedHtml}<div class="footnotes border-t border-black mt-9 py-3">
		{@html block.renderedHtml}
	</div>{/if}

<style lang="postcss">
	.footnotes :global(ol) {
		@apply list-none;
	}

	.footnotes :global(li) {
		@apply font-martina !text-sm lg:text-base;
		padding-left: -4rem;
		text-indent: 4rem;
	}

	.footnotes :global(li::before) {
		content: counter(list-item) '— ';
	}
</style>

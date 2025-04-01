<!-- [lang]/library/[ref]/+page.svelte -->
<script lang="ts">
    import LibraryPage from '../+page.svelte';
	import type { PageData } from './$types'
	interface Props {
		data: PageData;
		[key: string]: any
	}

	let { ...props }: Props = $props();

</script>

<LibraryPage {...props} />
<script lang="ts">
	import { page } from '$app/stores'
	import { language } from '$stores/language'
	interface Props {
		underline?: boolean;
		align?: 'center' | 'left' | 'right';
		label: string;
		title?: string | number | null;
		ref?: string | null;
	}

	let {
		underline = false,
		align = 'left',
		label,
		title = null,
		ref = null
	}: Props = $props();
    
    let cleanTitle = $derived(title ? String(title).replace(/<[^>]*>/g, '') : null)
    let isArabic = $derived($language === 'ar')
    let finalAlign = $derived(align === 'center' ? 'center' : (isArabic ? 'right' : align))
</script>

<div class="pt-2 pb-3 text-{finalAlign} {underline ? 'border-white border-b' : ''}">
	{#if label}
		{#if ref}
			<div class="flex flex-row w-full justify-between">
				<p class="text-{isArabic ? 'ar-xs font-manchette-ultralight' : 'xs font-martina tracking-widest'} uppercase mb-1">{label}</p>
				<a
					href="/{$page.data.lang}/library/{ref.toLowerCase()}"
					class="text-{isArabic ? 'ar-xs font-lyon' : 'xs font-martina tracking-widest'}  uppercase mb-1">#</a
				>
			</div>
		{:else}
			<p class="text-{isArabic ? 'ar-xs font-manchette-ultralight' : 'xs font-martina tracking-widest'}  uppercase mb-1">{label}</p>
		{/if}
	{/if}
	{#if title}
		<p class="text-{isArabic ? 'ar-sm font-lyon' : 'sm font-martina'} ">{cleanTitle}</p>
	{/if}
</div>

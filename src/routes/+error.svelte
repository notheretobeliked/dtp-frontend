<!--
	Shown inside the site's layout when an address leads nowhere, or when a
	page fails to load. The language comes from the address, as an address that
	matches no page has no language of its own.
-->
<script lang="ts">
	import { page } from '$app/stores'
	import { labelTranslations } from '$stores/translations'

	const lang = $derived($page.url.pathname.startsWith('/ar') ? 'ar' : 'en')
	const isArabic = $derived(lang === 'ar')
	const isNotFound = $derived($page.status === 404)
	const heading = $derived(isNotFound ? 'pageNotFound' : 'somethingWentWrong')
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div
	class="min-h-screen flex flex-col items-center justify-center gap-10 px-4 py-24 text-center bg-white-off"
>
	<header>
		<h1 class="text-2xl !font-manchette">{$labelTranslations[heading].ar}</h1>
		{#if !isArabic}
			<h1 class="text-2xl !font-boogy">{$labelTranslations[heading].en}</h1>
		{/if}
	</header>

	<p class="font-martina text-sm tracking-widest">{$page.status}</p>

	<nav class={isArabic ? 'text-ar-base font-lyon' : 'text-base font-martina'}>
		<a class="underline" href="/{lang}">{$labelTranslations.home[lang]}</a>
		<span class="mx-2">|</span>
		<a class="underline" href="/{lang}/library">{$labelTranslations.library[lang]}</a>
	</nav>
</div>

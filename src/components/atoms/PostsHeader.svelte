<script lang="ts">
	import { language } from "$stores/language";
	interface Props {
		slug?: string | null;
		byline?: string | null;
		date: string;
		title: string;
	}

	let {
		slug = null,
		byline = null,
		date,
		title
	}: Props = $props();
</script>

<div class="mx-2 lg:mx-0">
	<div class="w-full flex flex-col gap-4 border-b border-black mb-12">
		{#if slug}
			<a href={slug} class="contents">
				<h1 class="{$language === 'ar' ? 'font-manchette text-ar-lg md:text-ar-xl' : 'font-boogy text-lg md:text-xl' } text-xl text-center">{title}</h1>
				<div class="grid grid-cols-2">
					<p class="{$language === 'ar' ? 'font-lyon text-ar-base' : 'font-martina text-base' } w-full text-center">{byline}</p>
					<p class="{$language === 'ar' ? 'font-lyon text-ar-base' : 'font-martina text-base' } w-full text-center">{date}</p>
				</div>
			</a>
		{:else}
			<h1 class="{$language === 'ar' ? 'font-manchette text-ar-lg md:text-ar-xl' : 'font-boogy text-lg md:text-xl' } text-center">{title}</h1>
			<div class="grid grid-cols-2">
				<p class="{$language === 'ar' ? 'font-lyon text-ar-base' : 'font-martina text-base' } w-full text-center">{byline}</p>
				<p class="{$language === 'ar' ? 'font-lyon text-ar-base' : 'font-martina text-base' } w-full text-center">{date}</p>
			</div>
		{/if}
	</div>
</div>

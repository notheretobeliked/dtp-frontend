<!--
	The bare address (/) has no language. Readers whose browser asks for Arabic
	are sent to /ar and everyone else to /en.

	This is done by the page, not by a server, so that the whole site can be
	served as plain files. The script runs before anything is drawn; without
	scripts the reader lands on the English site.
-->
<svelte:head>
	<script>
		location.replace(
			navigator.languages.some((language) => language.toLowerCase().startsWith('ar')) ? '/ar' : '/en'
		)
	</script>
	<noscript><meta http-equiv="refresh" content="0; url=/en" /></noscript>
</svelte:head>

<p class="py-24 text-center font-martina">
	<a class="underline" href="/en">English</a> | <a class="underline" href="/ar">العربية</a>
</p>

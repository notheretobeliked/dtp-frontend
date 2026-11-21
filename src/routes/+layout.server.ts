/*
	What every page needs from outside itself: its language, and its title,
	description and share image.

	For a WordPress page these come from WordPress, when the site is built.
	WordPress is never asked once the site is running: see canAskWordPress.
	The library's books are not in WordPress, so nothing is asked about them
	here: a book's page supplies its own title and image (see
	library/[ref]/+page.server.ts).
*/

import { building, dev } from '$app/environment'
import { error } from '@sveltejs/kit'
import { PUBLIC_SITE_URL } from '$env/static/public'
import type { PageMetaQuery } from '$lib/graphql/generated'
import PageMeta from '$lib/graphql/query/page-meta.graphql?raw'
import { checkResponse, graphqlQuery } from '$lib/utilities/graphql'
import type { LayoutServerLoad } from './$types'

export const prerender = true

type WordPressPage = NonNullable<PageMetaQuery['page']>
type Seo = Extract<WordPressPage, { seo?: unknown }>['seo']

// Every page that exists is built ahead of time. A request that reaches this
// code on the running site is therefore for an address that doesn't exist
// (scanners send these by the hundred), and WordPress, which can't take that
// kind of traffic, isn't asked about it.
const canAskWordPress = building || dev

export const load: LayoutServerLoad = async function load({ params, url }) {
	// WordPress knows pages without their language prefix: /en/about is /about
	const uri = url.pathname.replace(/^\/(en|ar)/, '') || '/'

	const isBook = uri.startsWith('/library/')
	const page = isBook || !canAskWordPress ? null : await fetchPage(uri)

	// A page WordPress doesn't know gets the site's defaults, not an error. It
	// may be one of ours (the library), and if it is nothing at all, the page's
	// own loader says so, and +error.svelte is shown inside this layout.
	const hasContent = page && 'seo' in page

	return {
		lang: params.lang || 'en',
		languageCode: (hasContent && page.languageCode) || 'en',
		translations: (hasContent && page.translations) || [],
		seo: seoFor(hasContent ? page.seo : null, uri),
		uri,
		siteUrl: PUBLIC_SITE_URL
	}
}

async function fetchPage(uri: string): Promise<WordPressPage | null> {
	const response = await graphqlQuery(PageMeta, { uri })
	checkResponse(response)

	const { data }: { data?: PageMetaQuery } = await response.json()
	if (!data) error(500, 'No data received from GraphQL query')

	return data.page ?? null
}

/** The page's own SEO fields, with its address moved from WordPress's domain to the site's */
function seoFor(seo: Seo, uri: string) {
	if (!seo?.opengraphUrl) {
		return {
			title: 'Decolonizing the Page',
			metaDesc: 'Decolonizing the Page',
			opengraphUrl: `${PUBLIC_SITE_URL}${uri}`,
			opengraphImage: `${PUBLIC_SITE_URL}/decolonizingthepage.jpg`
		}
	}

	const wordPressOrigin = new URL(seo.opengraphUrl).origin
	return { ...seo, opengraphUrl: seo.opengraphUrl.replace(wordPressOrigin, PUBLIC_SITE_URL) }
}

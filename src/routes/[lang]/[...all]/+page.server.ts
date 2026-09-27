export const prerender = true

export const entries = () => {
	const routes = [
		{ lang: 'en', paths: ['', 'learning-hub'] },
		{ lang: 'ar', paths: ['', 'ghurfat-al-taallum'] }
	]

	return routes.flatMap(({ lang, paths }) =>
		paths.map((path) => ({
			lang,
			all: path
		}))
	)
}
import PageContent from '$lib/graphql/query/page.graphql?raw'
import Posts from '$lib/graphql/query/posts.graphql?raw'
import { checkResponse, graphqlQuery } from '$lib/utilities/graphql'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import type { EditorBlock } from '$lib/types/wp-types'
import { flatListToHierarchical } from '$lib/server/utilities'
import libraryData from '$lib/data/library-data.json'

const creditFields = [
	'ref',
	'title',
	'author',
	'publisher',
	'place',
	'year',
	'coverDesign',
	'coverIllustration',
	'coverCalligraphy',
	'pageDesign',
	'pageIllustration',
	'pageCalligraphy',
	'collection'
] as const

// Library records for the works shown in an exhibition room, keyed by
// lowercased ref. Printed as the room's list of works.
function getLibraryCredits(blocks: EditorBlock[], lang: string) {
	const refs = new Set<string>()
	for (const block of blocks as any[]) {
		if (block.name !== 'acf/exhibition-room') continue
		for (const cabinet of block.exhibitionRoom?.cabinets ?? [])
			for (const group of cabinet?.groups ?? [])
				for (const image of group?.images?.nodes ?? [])
					if (image?.reference) refs.add(image.reference.toLowerCase())
	}
	if (!refs.size) return null

	const credits: Record<string, Record<string, string | number | null>> = {}
	for (const item of (libraryData as Record<string, any[]>)[lang] ?? []) {
		const ref = item.ref?.toLowerCase()
		if (ref && refs.has(ref)) {
			credits[ref] = Object.fromEntries(creditFields.map((field) => [field, item[field] ?? null]))
		}
	}
	return credits
}

export const load: PageServerLoad = async function load({ params, url, fetch }) {
	const uri = `/${params.all || ''}`

	// Add check for file extensions that shouldn't be handled by the page route
	if (uri.match(/\.(woff2|jpg|png|gif|svg|css|js|json)$/i)) {
		throw error(404, {
			message: 'Not a page route'
		})
	}
	const isLearningHub = uri.endsWith('/learning-hub') || uri.endsWith('/ghurfat-al-taallum')
	const isLearningHubSingle = /^\/(learning-hub|ghurfat-al-taallum)\/[^\/]+$/.test(uri)

	// Initialize these variables outside the if block
	let flattenedData = []
	let learningHubCategories = []

	if (isLearningHub) {
		const response = await graphqlQuery(Posts, { lang: params.lang })
		checkResponse(response)
		const { data } = await response.json()

		const posts = data.posts.nodes

		flattenedData = posts.map((post) => {
			const date = new Date(post.date)
			const formattedDate = date
				.toLocaleDateString('en-GB', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric'
				})
				.replace(/\//g, '.')

			return {
				title: post.title,
				byline: post.learningHubFields.byline || '',
				slug: `/${params.lang}/learning-hub/${post.slug}`, // Modified this line to include language
				category: post.categories.nodes[0]?.name || 'Uncategorized',
				categorySlug: post.categories.nodes[0]?.slug || 'uncategorized',
				date: formattedDate
			}
		})

		learningHubCategories = Array.from(
			new Set(
				posts
					.map((post) => ({
						name: post.categories.nodes[0]?.name || 'Uncategorized',
						slug: post.categories.nodes[0]?.slug || 'uncategorized'
					}))
					.map(JSON.stringify)
			)
		).map(JSON.parse)
	}

	// Fetch books from API route
    const learningHubSlugs = {
        en: 'learning-hub',
        ar: 'ghurfat-al-taallum'
    }
	try {
		const response = await graphqlQuery(PageContent, { uri: `/${params.lang}${uri}` })
		checkResponse(response)
		const { data } = await response.json()

		// Only throw 404 if we truly have no data to work with
		if (!data) {
			throw error(404, {
				message: 'No data returned from GraphQL query'
			})
		}

		let editorBlocks: EditorBlock[] = data.nodeByUri.editorBlocks
			? flatListToHierarchical(data.nodeByUri.editorBlocks)
			: []

		const libraryCredits = getLibraryCredits(editorBlocks, params.lang)

		return {
			data: data,
			uri: uri,
			editorBlocks: editorBlocks,
            learningHubSlug: learningHubSlugs[params.lang],
			...(isLearningHub && {
				learningHubPosts: flattenedData,
				learningHubCategories
			}),
			...(isLearningHubSingle && {
				isLearningHubSingle
			}),
			...(libraryCredits && {
				libraryCredits
			})
		}
	} catch (err: unknown) {
		console.error('Server Error:', err)
		const httpError = err as { status: number; message: string }
		if (httpError.message) {
			throw error(httpError.status ?? 500, httpError.message)
		}
		throw error(500, 'Internal Server Error')
	}
}

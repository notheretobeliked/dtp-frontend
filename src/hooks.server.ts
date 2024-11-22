import type { LibraryItemsQuery } from '$lib/graphql/generated'
import { dev } from '$app/environment'

type AppState = {
	books: {
		[lang: string]: LibraryItemsQuery['books']['nodes']
	}
}

const state: AppState = {
	books: {}
}

export const handle = async ({ event, resolve }) => {
	const lang = event.params.lang || 'en'

	if (!state.books[lang]) {
		try {
			// In production/build, use the pre-fetched data
			const data = await import('../.svelte-kit/library-data.json')
			state.books = data.default
		} catch (error) {
			console.error('Error loading library data:', error)
			state.books[lang] = []
		}
	}

	event.locals.books = state.books[lang] || []
	return await resolve(event)
}
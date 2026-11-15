import { error } from '@sveltejs/kit'
import { getBooks, getTaxonomies, isLibraryLanguage } from '$lib/server/library'
import type { PageServerLoad } from './$types'

export const prerender = true

export const load: PageServerLoad = function load({ params }) {
	const lang = params.lang
	if (!isLibraryLanguage(lang)) error(404, 'Sorry, this page does not exist')

	const books = getBooks(lang)
	const years = books.map((book) => book.year).filter((year) => typeof year === 'number')

	return {
		books,
		...getTaxonomies(lang),
		language: lang,
		yearRange: {
			minYear: years.length ? Math.min(...years) : null,
			maxYear: years.length ? Math.max(...years) : null
		}
	}
}

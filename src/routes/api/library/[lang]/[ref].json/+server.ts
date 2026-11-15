/*
	One book's record as a static file, e.g. /api/library/en/a006.json. The
	label popover loads this when an image of the book is clicked.
*/

import { error, json } from '@sveltejs/kit'
import { getBook, getBookEntries, isLibraryLanguage } from '$lib/server/library'
import type { EntryGenerator, RequestHandler } from './$types'

export const prerender = true

export const entries: EntryGenerator = getBookEntries

export const GET: RequestHandler = ({ params }) => {
	const book = isLibraryLanguage(params.lang) ? getBook(params.lang, params.ref) : undefined
	if (!book) error(404, 'No such book')

	return json(book)
}

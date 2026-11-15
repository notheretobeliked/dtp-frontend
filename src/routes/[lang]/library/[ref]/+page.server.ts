import { error, redirect } from '@sveltejs/kit'
import { PUBLIC_SITE_URL } from '$env/static/public'
import { getBook, getBookEntries, isLibraryLanguage } from '$lib/server/library'
import type { Book } from '$lib/types/general'
import { bookPath, LIBRARY_LANGUAGES } from '$lib/utilities/library'
import type { EntryGenerator, PageServerLoad } from './$types'

// Every book's page is built ahead of time. 'auto' keeps the route on the
// server as well, for the one thing a static file can't do: these addresses
// are cited elsewhere, sometimes in capitals (/en/library/A006), and those
// are sent on to the lowercase address.
export const prerender = 'auto'

export const entries: EntryGenerator = getBookEntries

export const load: PageServerLoad = function load({ params }) {
	const { lang, ref } = params
	if (!isLibraryLanguage(lang)) error(404, 'Sorry, this page does not exist')

	const book = getBook(lang, ref)
	if (!book) error(404, 'Sorry, this book is not in the library')

	if (ref !== ref.toLowerCase()) redirect(301, bookPath(lang, ref))

	return {
		book,
		language: lang,
		seo: {
			title: `${book.title?.trim() ?? book.ref} – Decolonizing the Page`,
			metaDesc: describe(book, lang),
			opengraphUrl: `${PUBLIC_SITE_URL}${bookPath(lang, ref)}`,
			opengraphImage: book.thumbnailCoverImage
		},
		// Lets the header's language switch stay on this book
		translations: LIBRARY_LANGUAGES.filter((other) => other !== lang).map((other) => ({
			languageCode: other,
			uri: `/library/${ref}`
		}))
	}
}

/** "Mahmoud Darwish. Union of Palestinian Writers and Journalists, Beirut, 1977" */
function describe(book: Book, lang: string): string {
	const comma = lang === 'ar' ? '، ' : ', '
	const publication = [book.publisher, book.place, book.year].filter(Boolean).join(comma)
	return [book.author, publication].filter(Boolean).join('. ')
}

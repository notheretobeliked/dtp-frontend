/*
	The library: every book record, in both languages, as written to
	$lib/data by the prebuild script (build-scripts/fetch-library-data.ts).
	Everything here is fixed at build time, so the routes that read it can be
	prerendered.
*/

import libraryData from '$lib/data/library-data.json'
import taxonomiesData from '$lib/data/taxonomies.json'
import type { Book, LibraryTaxonomies } from '$lib/types/general'
import { LIBRARY_LANGUAGES, type LibraryLanguage } from '$lib/utilities/library'

const books = libraryData as unknown as Record<LibraryLanguage, Book[]>
const taxonomies = taxonomiesData as unknown as Record<LibraryLanguage, LibraryTaxonomies>

export const isLibraryLanguage = (lang: string): lang is LibraryLanguage =>
	LIBRARY_LANGUAGES.includes(lang as LibraryLanguage)

export const getBooks = (lang: LibraryLanguage): Book[] => books[lang] ?? []

/** The artists, authors and publishers the library can be filtered by */
export const getTaxonomies = (lang: LibraryLanguage): LibraryTaxonomies =>
	taxonomies[lang] ?? { artists: [], authors: [], publishers: [] }

/** Looks a book up by its reference, e.g. "a006". Case doesn't matter. */
export function getBook(lang: LibraryLanguage, ref: string): Book | undefined {
	const wanted = ref.toLowerCase()
	return getBooks(lang).find((book) => book.ref?.toLowerCase() === wanted)
}

/** Every book in every language, as route parameters for prerendering */
export function getBookEntries(): { lang: LibraryLanguage; ref: string }[] {
	return LIBRARY_LANGUAGES.flatMap((lang) =>
		getBooks(lang).flatMap((book) => (book.ref ? [{ lang, ref: book.ref.toLowerCase() }] : []))
	)
}

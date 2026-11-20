/*
	Addresses within the library, and the library's filters as they appear in
	its address: /en/library?artist=kamal-boullata&from=1970#a006
*/

import type { NamedEntry } from '$lib/types/general'

export const LIBRARY_LANGUAGES = ['en', 'ar'] as const
export type LibraryLanguage = (typeof LIBRARY_LANGUAGES)[number]

export interface LibraryFilters {
	/** Slugs of the selected artist, author and publisher; '' for none */
	selectedArtist: string
	selectedAuthor: string
	selectedPublisher: string
	/** Years as text, as the filter menus hold them; '' for no limit */
	yearFrom: string
	yearTo: string
	searchFilter: string
}

/** The name each filter goes by in the address */
const FILTER_PARAMS: Record<keyof LibraryFilters, string> = {
	selectedArtist: 'artist',
	selectedAuthor: 'author',
	selectedPublisher: 'publisher',
	yearFrom: 'from',
	yearTo: 'to',
	searchFilter: 'q'
}

const filterKeys = Object.keys(FILTER_PARAMS) as (keyof LibraryFilters)[]

/** A book's own page */
export const bookPath = (lang: string, ref: string) => `/${lang}/library/${ref.toLowerCase()}`

/** The address of a book's static record, which the label popover loads */
export const bookDataPath = (lang: string, ref: string) =>
	`/api/library/${lang}/${ref.toLowerCase()}.json`

/**
 * The library, optionally filtered and scrolled to one book. Filters that are
 * empty, or the same as in `defaults`, are left out of the address.
 */
export function libraryPath(
	lang: string,
	filters: Partial<LibraryFilters> = {},
	options: { ref?: string | null; defaults?: Partial<LibraryFilters> } = {}
): string {
	const query = new URLSearchParams()
	for (const key of filterKeys) {
		const value = filters[key]
		if (value && value !== options.defaults?.[key]) query.set(FILTER_PARAMS[key], value)
	}

	const search = query.toString() ? `?${query}` : ''
	const hash = options.ref ? `#${options.ref.toLowerCase()}` : ''
	return `/${lang}/library${search}${hash}`
}

/** The filters named in an address; any that are missing come from `defaults`. */
export function readLibraryFilters(query: URLSearchParams, defaults: LibraryFilters): LibraryFilters {
	const filters = { ...defaults }
	for (const key of filterKeys) {
		const value = query.get(FILTER_PARAMS[key])
		if (value) filters[key] = value
	}
	return filters
}

export interface CreditPart {
	text: string
	/** The library filtered by this name, when the name is one it can be filtered by */
	href?: string
}

/**
 * Splits a credit such as "Jawad Salim, Khaled al-Rahhal" into its names and
 * links each to the library filtered by that person or publisher. Separators,
 * and names with no entry to filter by, stay as plain text.
 */
export function linkCredit(
	credit: string,
	entries: NamedEntry[] | null | undefined,
	filter: 'selectedArtist' | 'selectedAuthor' | 'selectedPublisher',
	lang: string
): CreditPart[] {
	const slugByName = new Map((entries ?? []).map((entry) => [entry.name.trim(), entry.slug]))

	// Names are separated by a Latin or an Arabic comma; the capture keeps the separators
	return credit
		.split(/(\s*[,،]\s*)/)
		.filter(Boolean)
		.map((text) => {
			const slug = slugByName.get(text.trim())
			return slug ? { text, href: libraryPath(lang, { [filter]: slug }) } : { text }
		})
}

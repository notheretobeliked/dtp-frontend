import type { ImageObject } from '$lib/types/wp-types.ts'

/** An artist, author or publisher, as attached to a book */
export interface NamedEntry {
	name: string
	slug: string
}

/** An artist, author or publisher, as listed in the library's filters */
export interface TaxonomyEntry extends NamedEntry {
	/** The name in the other language */
	nameTranslated: string
	description: string
}

export interface LibraryTaxonomies {
	artists: TaxonomyEntry[]
	authors: TaxonomyEntry[]
	publishers: TaxonomyEntry[]
}

export interface Book {
	slug: string
	edition: string | null
	artists?: NamedEntry[] | null
	authors?: NamedEntry[] | null
	publishers?: NamedEntry[] | null
	artistFilterTerm: string | null
	authorFilterTerm: string | null
	publisherFilterTerm: string | null
	titleFilterTerm: string | null
	exhibition: string | null
	notes: string | null
	numperOfPages: number | null
	place: string | null
	printer: string | null
	series: string | null
	size: string | null
	title: string | null
	year: number | null
	ref: string | null
	publisher: string | null
	author: string | null
	coverDesign: string | null
	coverIllustration: string | null
	pageDesign: string | null
	pageCalligraphy: string | null
	pageIllustration: string | null
	translation: string | null
	coverCalligraphy: string | null
	collection: string | null
	thumbnailCoverImage: ImageObject| null
	thumbnailImages: Array<ImageObject> | null
}

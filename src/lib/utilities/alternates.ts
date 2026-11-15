/*
	The same page in the site's two languages, for the links that tell search
	engines an English and an Arabic page belong together.
*/

interface Translation {
	languageCode?: string | null
	uri?: string | null
}

export interface LanguageAlternate {
	/** 'en', 'ar', or 'x-default' for readers of neither */
	hreflang: string
	path: string
}

/**
 * The address of this page in the other language, or null if it has none.
 * `translations` is what WordPress knows about the page; home pages and the
 * library are the same in both languages but for the prefix.
 */
function otherLanguagePath(pathname: string, translations: Translation[]): string | null {
	const [lang, ...rest] = pathname.split('/').filter(Boolean)
	if (lang !== 'en' && lang !== 'ar') return null

	const other = lang === 'en' ? 'ar' : 'en'
	if (!rest.length) return `/${other}`
	if (rest[0] === 'library') return `/${[other, ...rest].join('/')}`

	const translation = translations.find((translation) => translation.languageCode === other)
	return translation?.uri ? `/${other}${translation.uri}` : null
}

/** This page and its translation, English first; empty for a page with no translation. */
export function languageAlternates(
	pathname: string,
	translations: Translation[]
): LanguageAlternate[] {
	const otherPath = otherLanguagePath(pathname, translations)
	if (!otherPath) return []

	const isEnglish = pathname.startsWith('/en')
	const english = isEnglish ? pathname : otherPath
	const arabic = isEnglish ? otherPath : pathname

	return [
		{ hreflang: 'en', path: english },
		{ hreflang: 'ar', path: arabic },
		{ hreflang: 'x-default', path: english }
	]
}

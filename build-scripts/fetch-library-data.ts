import { writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import 'dotenv/config'

import { getEnvVar } from '../src/lib/server/config'
import { LibraryItems } from '../src/lib/graphql/query/library-prefetch'
import { readFileSync } from 'fs'

import { error } from '@sveltejs/kit'

// Read the sitemap GraphQL query
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const sitemapQuery = readFileSync(join(__dirname, '../src/lib/graphql/query/sitemap.graphql'), 'utf-8')

interface Person {
	name: string,
	nameTranslated: string,
	slug: string
	description: string
}

interface Taxonomies {
	artists: Person[]
	authors: Person[]
	publishers: Person[]
}

interface SitemapEntry {
	uri: string
	modified: string
	language: {
		code: string
	}
	translations: {
		language: {
			code: string
		}
		uri: string
		slug: string
	}[]
}

interface SitemapData {
	arPosts: { nodes: SitemapEntry[] }
	arPages: { nodes: SitemapEntry[] }
	enPosts: { nodes: SitemapEntry[] }
	enPages: { nodes: SitemapEntry[] }
}

interface ProcessedSitemapEntry {
	uri: string
	modified: string
	languageCode: string
	type: string
	slug: string
	translations: {
		languageCode: string
		uri: string
		slug: string
	}[]
}

export function checkResponse(response: Response) {
	const { headers, ok } = response
	if (!ok) {
		error(502, 'Bad Gateway')
	}

	if (!headers.get('content-type')?.includes('application/json')) {
		error(502, 'Bad Gateway: expected JSON data from GraphQL backend')
	}
}

const restructureLibraryItems = (data: any, language: string) => {
	const separator = language === 'ar' ? '، ' : ', '
	return data.books?.nodes
		?.sort((a, b) => a.slug.localeCompare(b.slug))
		.map((book) => {
			const bookData = book.bookData
			if (!bookData) return null

			const firstImage = bookData.images?.nodes[0]

			// Create sets for unique artists, authors, and publishers
			const artists = new Set(
				[
					...(bookData.personCoverDesign?.nodes || []),
					...(bookData.personCoverIllustration?.nodes || []),
					...(bookData.personPageDesign?.nodes || []),
					...(bookData.personPageCalligraphy?.nodes || []),
					...(bookData.personPageIllustration?.nodes || []),
					...(bookData.personCoverCalligraphy?.nodes || [])
				].map((person) => ({
					name: person.name,
					slug: person.slug
				}))
			)

			const authors = new Set(
				bookData.personAuthor?.nodes.map((author: any) => ({
					name: author.name,
					slug: author.slug
				})) || []
			)
			const publishers = new Set(
				bookData.publisher?.nodes.map((publisher: any) => ({
					name: publisher.name,
					slug: publisher.slug
				})) || []
			)

			// Create filter terms
			const artistFilterTerm = Array.from(artists)
				.map((artist) => `${artist.name} ${artist.slug}`)
				.join(' ')
				.toLowerCase()
			const authorFilterTerm = Array.from(authors)
				.map((author: any) => `${author.name} ${author.slug}`)
				.join(' ')
				.toLowerCase()
			const publisherFilterTerm = Array.from(publishers)
				.map((publisher: any) => `${publisher.name} ${publisher.slug}`)
				.join(' ')
				.toLowerCase()

			return {
				slug: book.slug,
				edition: bookData.edition ?? null,
				exhibition: bookData.exhibition ?? null,
				notes: bookData.notes ?? null,
				numperOfPages: bookData.numperOfPages ?? null,
				place: bookData.place ?? null,
				printer: bookData.printer ?? null,
				series: bookData.series ?? null,
				size: bookData.size ?? null,
				title: bookData.title ?? null,
				year: bookData.year ?? null,
				ref: bookData.ref ?? null,
				artists: Array.from(artists),
				authors: Array.from(authors),
				publishers: Array.from(publishers),
				artistFilterTerm: Array.from(artists)
					.map((artist: any) => `${artist.name} ${artist.slug}`)
					.join(' ')
					.toLowerCase(),
				authorFilterTerm: Array.from(authors)
					.map((author: any) => `${author.name} ${author.slug}`)
					.join(' ')
					.toLowerCase(),
				publisherFilterTerm: Array.from(publishers)
					.map((publisher: any) => `${publisher.name} ${publisher.slug}`)
					.join(' ')
					.toLowerCase(),
				publisher: bookData.publisher?.nodes.map((p: any) => p.name).join(separator) ?? null,
				author: bookData.personAuthor?.nodes.map((a: any) => a.name).join(separator) ?? null,
				coverDesign: bookData.personCoverDesign?.nodes.map((d: any) => d.name).join(separator) ?? null,
				coverIllustration:
					bookData.personCoverIllustration?.nodes.map((i: any) => i.name).join(separator) ?? null,
				pageDesign: bookData.personPageDesign?.nodes.map((d: any) => d.name).join(separator) ?? null,
				pageCalligraphy:
					bookData.personPageCalligraphy?.nodes.map((c: any) => c.name).join(separator) ?? null,
				pageIllustration:
					bookData.personPageIllustration?.nodes.map((i: any) => i.name).join(separator) ?? null,
				translation: bookData.personTranslation?.nodes.map((t: any) => t.name).join(separator) ?? null,
				coverCalligraphy:
					bookData.personCoverCalligraphy?.nodes.map((c: any) => c.name).join(separator) ?? null,
				collection: bookData.collection?.nodes.map((c: any) => c.name).join(separator) ?? null,
				thumbnailCoverImage: firstImage,
				thumbnailImages: bookData.images?.nodes,
				titleFilterTerm: bookData.title?.toLowerCase() ?? null
			}
		})
		.filter((book): book is NonNullable<typeof book> => book !== null)
}

async function graphqlQuery<TData = any, TVariables = any>(
	query: string,
	variables: TVariables
): Promise<Response> {
	return fetch(getEnvVar('GRAPHQL_ENDPOINT'), {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			query,
			variables
		}),
		cache: 'no-cache'
	})
}

async function fetchAllLibraryItems(language: string) {
	let hasNextPage = true
	let after: string | null = null
	const allBooks: any[] = []

	while (hasNextPage) {
		const response = await graphqlQuery(LibraryItems, { language, after })
		checkResponse(response)
		const { data } = await response.json()

		if (!data?.books?.nodes) {
			throw error(404, { message: 'Books not found' })
		}

		allBooks.push(...data.books.nodes)
		hasNextPage = data.books.pageInfo.hasNextPage
		after = data.books.pageInfo.endCursor
	}

	return {
		books: restructureLibraryItems({ books: { nodes: allBooks } }, language),
		taxonomies: extractUniqueTaxonomies(allBooks)
	}
}

const projectRoot = join(__dirname, '..')

function extractUniqueTaxonomies(books: any[]): Taxonomies {
	const artistsMap = new Map<string, Person>()
	const authorsMap = new Map<string, Person>()
	const publishersMap = new Map<string, Person>()

	books.forEach((book) => {
		const bookData = book.bookData
		if (!bookData) return


		// Collect all artist-type persons
		;[
			...(bookData.personCoverDesign?.nodes || []),
			...(bookData.personCoverIllustration?.nodes || []),
			...(bookData.personPageDesign?.nodes || []),
			...(bookData.personPageCalligraphy?.nodes || []),
			...(bookData.personPageIllustration?.nodes || []),
			...(bookData.personCoverCalligraphy?.nodes || [])
		].forEach((person: any) => {
			artistsMap.set(person.slug, {
				name: person.name,
				nameTranslated: person.translations?.[0]?.name || null,  // Changed this line
				slug: person.slug,
				description: person.description || ''
			})
		})


		// Collect authors
		bookData.personAuthor?.nodes.forEach((author: any) => {
			authorsMap.set(author.slug, {
				name: author.name,
				nameTranslated: author.translations?.[0]?.name || null,  // Changed this line || '',
				slug: author.slug,
				description: author.description || ''
			})
		})

		// Collect publishers
		bookData.publisher?.nodes.forEach((publisher: any) => {
			publishersMap.set(publisher.slug, {
				name: publisher.name,
				nameTranslated: publisher.translations?.[0]?.name || null,  // Changed this line
				slug: publisher.slug,
				description: publisher.description || ''
			})
		})
	})

	return {
		artists: Array.from(artistsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
		authors: Array.from(authorsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
		publishers: Array.from(publishersMap.values()).sort((a, b) => a.name.localeCompare(b.name))
	}
}

function processSitemapData(data: SitemapData): ProcessedSitemapEntry[] {
	const processedEntries: ProcessedSitemapEntry[] = []
	
	// Process English content (primary language)
	const englishContent = [
		...data.enPages.nodes.map(node => ({ ...node, type: 'pages' })),
		...data.enPosts.nodes.map(node => ({ ...node, type: 'posts' }))
	]
	
	// Process Arabic content
	const arabicContent = [
		...data.arPages.nodes.map(node => ({ ...node, type: 'pages' })),
		...data.arPosts.nodes.map(node => ({ ...node, type: 'posts' }))
	]
	
	// Add all English content (primary language) - prepend /en/ to English URLs
	englishContent.forEach((node) => {
		if (node.uri) {
			// Handle base route specially - should be /en not /en/
			const normalizedUri = node.uri === '/' ? '/en' : '/en/' + node.uri.replace(/^\/+/, '')
			const translations = node.translations.map(t => ({
				languageCode: t.language.code,
				uri: t.uri === '/' ? '/' : '/' + t.uri.replace(/^\/+/, ''),
				slug: t.slug
			}))
			
			processedEntries.push({
				uri: normalizedUri,
				modified: node.modified,
				languageCode: node.language.code,
				type: node.type,
				slug: normalizedUri.split('/').pop() || '',
				translations
			})
		}
	})
	
	// Add Arabic content that doesn't have English translations
	arabicContent.forEach((node) => {
		if (node.uri) {
			// Check if this Arabic content has an English translation
			const hasEnglishTranslation = node.translations.some(t => t.language.code === 'en')
			
			// Only add if it doesn't have an English translation
			if (!hasEnglishTranslation) {
				// Handle base route specially - should be /ar not /ar/
				const normalizedUri = node.uri === '/' ? '/ar' : '/ar/' + node.uri.replace(/^\/+/, '')
				const translations = node.translations.map(t => ({
					languageCode: t.language.code,
					uri: t.uri === '/' ? '/' : '/' + t.uri.replace(/^\/+/, ''),
					slug: t.slug
				}))
				
				processedEntries.push({
					uri: normalizedUri,
					modified: node.modified,
					languageCode: node.language.code,
					type: node.type,
					slug: normalizedUri.split('/').pop() || '',
					translations
				})
			}
		}
	})
	
	
	// Sort by modified date (newest first)
	return processedEntries.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
}

async function fetchSitemapData(): Promise<ProcessedSitemapEntry[]> {
	const response = await graphqlQuery(sitemapQuery, {})
	checkResponse(response)
	const { data }: { data: SitemapData } = await response.json()
	
	if (!data) {
		throw error(500, 'No sitemap data received from GraphQL query')
	}
	
	return processSitemapData(data)
}

function generateSitemapXML(sitemapEntries: ProcessedSitemapEntry[], baseUrl: string): string {
	const entries = sitemapEntries.map(entry => {
		const fullUrl = `${baseUrl}${entry.uri}`
		const lastmod = new Date(entry.modified).toISOString()
		
		// Determine priority based on URL depth
		let priority = '0.6' // Default for deep pages (3+ levels)
		
		// Count URL segments (excluding language prefix)
		const segments = entry.uri.split('/').filter(segment => segment && segment !== 'en' && segment !== 'ar')
		const depth = segments.length
		
		if (entry.uri === '/en' || entry.uri === '/ar' || entry.uri === '/en/' || entry.uri === '/ar/') {
			// Homepage gets highest priority
			priority = '1.0'
		} else if (depth === 1) {
			// Top level pages (e.g., /en/about, /ar/man-nahn)
			priority = '0.8'
		} else if (depth >= 3) {
			// Deep pages (e.g., /en/learning-hub/some-post)
			priority = '0.6'
		}
		
		// Add hreflang attributes for multi-language support
		let hreflangEntries = ''
		if (entry.translations && entry.translations.length > 0) {
			// Add hreflang entries for each translation
			hreflangEntries = entry.translations.map(translation => {
				// Ensure proper language prefixes
				let translationUri
				if (translation.languageCode === 'en') {
					// Handle base route specially for English
					translationUri = translation.uri === '/' ? '/en' : '/en/' + translation.uri.replace(/^\/+/, '').replace(/^en\//, '')
				} else if (translation.languageCode === 'ar') {
					// Handle base route specially for Arabic
					translationUri = translation.uri === '/' ? '/ar' : '/ar/' + translation.uri.replace(/^\/+/, '').replace(/^ar\//, '')
					
					// Manual override for WordPress admin issue: maktaba -> library
					if (translationUri === '/ar/maktaba') {
						translationUri = '/ar/library'
					}
				} else {
					translationUri = translation.uri
				}
				return `    <xhtml:link rel="alternate" hreflang="${translation.languageCode}" href="${baseUrl}${translationUri}" />`
			}).join('\n')
			
			// Add x-default (English as default)
			const englishTranslation = entry.translations.find(t => t.languageCode === 'en')
			const defaultUri = englishTranslation 
				? (englishTranslation.uri === '/' ? '/en' : '/en/' + englishTranslation.uri.replace(/^\/+/, '').replace(/^en\//, ''))
				: entry.uri
			hreflangEntries += `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${defaultUri}" />`
		}
		
		return `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>${hreflangEntries ? '\n' + hreflangEntries : ''}
  </url>`
	}).join('\n')
	
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>`
}


async function fetchAndSaveLibraryData() {
	try {
		const languages = ['en', 'ar']
		const libraryData: Record<string, any> = {}
		const taxonomiesData: Record<string, Taxonomies> = {}

		// Get base URL from environment
		const baseUrl = process.env.PUBLIC_SITE_URL || 'https://www.decolonizingthepage.com'

		// Fetch library data and taxonomies for each language
		for (const lang of languages) {
			console.log(`Fetching data for language: ${lang}...`)
			const { books, taxonomies } = await fetchAllLibraryItems(lang)
			libraryData[lang] = books
			taxonomiesData[lang] = taxonomies
			console.log(`✅ Successfully fetched data for ${lang}`)
		}

		// Fetch sitemap data (single query for all languages)
		console.log('Fetching sitemap data...')
		const sitemapEntries = await fetchSitemapData()
		console.log(`✅ Successfully fetched sitemap data with ${sitemapEntries.length} entries`)

		// Write JSON files
		const dataDir = join(projectRoot, 'src/lib/data')
		mkdirSync(dataDir, { recursive: true })

		writeFileSync(join(dataDir, 'library-data.json'), JSON.stringify(libraryData), 'utf-8')
		writeFileSync(join(dataDir, 'taxonomies.json'), JSON.stringify(taxonomiesData), 'utf-8')

		// Generate and write sitemap files
		const staticDir = join(projectRoot, 'static')
		mkdirSync(staticDir, { recursive: true })

		// Generate combined sitemap with hreflang support
		const sitemapXML = generateSitemapXML(sitemapEntries, baseUrl)
		writeFileSync(join(staticDir, 'sitemap.xml'), sitemapXML, 'utf-8')

		console.log('✅ Library data, taxonomies, and sitemap XML generated successfully')
		console.log(`📄 Generated sitemap.xml with ${sitemapEntries.length} entries`)
	} catch (error) {
		console.error('Failed to generate data:', error)
		process.exit(1)
	}
}

fetchAndSaveLibraryData()

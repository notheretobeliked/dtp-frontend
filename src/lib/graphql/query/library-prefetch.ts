export const LibraryItems = `
query LibraryItems($language: String!, $after: String) {
	books(where: { language: $language }, first: 20, after: $after) {
		pageInfo {
			endCursor
			hasNextPage
		}
		nodes {
			slug
			bookData {
				edition
				exhibition
				notes
				numperOfPages
				place
				printer
				series
				size
				title
				year
				ref
				publisher {
					nodes {
						name
						slug
						description
						translations {
							name
						}
					}
				}
				personAuthor {
					nodes {
						...NameSlugFields
					}
				}
				personCoverDesign {
					nodes {
						...NameSlugFields
					}
				}
				personCoverIllustration {
					nodes {
						...NameSlugFields
					}
				}
				personPageDesign {
					nodes {
						...NameSlugFields
					}
				}
				personPageCalligraphy {
					nodes {
						...NameSlugFields
					}
				}
				personPageIllustration {
					nodes {
						...NameSlugFields
					}
				}
				personTranslation {
					nodes {
						...NameSlugFields
					}
				}
				personCoverCalligraphy {
					nodes {
						...NameSlugFields
					}
				}
				collection {
					nodes {
						name
						slug
					}
				}
				images {
					nodes {
						mediaDetails {
							sizes(exclude: [MEDIUM_LARGE, MEDIUM]) {
								sourceUrl
								height
								width
								mimeType
								name
							}
						}
						altText
						caption
						sourceUrl
					}
				}
			}
		}
	}
}

fragment NameSlugFields on Person {
	name
	slug
	description
	translations {
		name
	}
}
`

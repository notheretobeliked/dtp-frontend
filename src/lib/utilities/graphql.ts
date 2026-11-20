import { GRAPHQL_ENDPOINT } from '$env/static/private'

import { error } from '@sveltejs/kit'

export function checkResponse(response: Response) {
	const { headers, ok } = response
	if (!ok) {
		error(502, 'Bad Gateway')
	}

	if (!headers.get('content-type')?.includes('application/json')) {
		error(502, 'Bad Gateway: expected JSON data from GraphQL backend')
	}
}

// WordPress answers in about a second. Past this it is overloaded or down, and
// waiting longer only keeps the build, or a server function, hanging.
const TIMEOUT_MS = 20_000

export async function graphqlQuery<TData = any, TVariables = any>(
	query: string,
	variables: TVariables
): Promise<Response> {
	return fetch(GRAPHQL_ENDPOINT, {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			query,
			variables
		}),
		cache: 'no-cache', // This tells the fetch to bypass the cache
		signal: AbortSignal.timeout(TIMEOUT_MS)
	})
}

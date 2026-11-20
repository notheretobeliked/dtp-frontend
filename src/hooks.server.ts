/*
	An address with no language in it (/beyond-words) is an old or hand-typed
	form of the English one (/en/beyond-words). Rather than answer "not found",
	the site sends the reader to the English address, which then answers for
	itself: with the page if there is one, with "not found" if there isn't.

	Pages that exist are served as files and never come through here.
*/

import { building } from '$app/environment'
import type { Handle } from '@sveltejs/kit'

const HAS_LANGUAGE = /^\/(en|ar)(\/|$)/

// The site's own endpoints and files, and anything with a file extension.
// None of these is a page, and the last is what most scanners ask for.
const IS_NOT_A_PAGE = /^\/(api|_app)\/|\.[a-z0-9]+$/i

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event)
	if (building || response.status !== 404) return response

	const { pathname, search } = event.url
	if (pathname === '/' || HAS_LANGUAGE.test(pathname) || IS_NOT_A_PAGE.test(pathname)) {
		return response
	}

	return new Response(null, { status: 308, headers: { location: `/en${pathname}${search}` } })
}

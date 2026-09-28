import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	onwarn: (warning, handler) => {
		// suppress warnings on `vite dev` and `vite build`; but even without this, things still work
		if (warning.code === 'a11y-click-events-have-key-events') return
		if (warning.code === 'a11y-no-static-element-interactions') return
		handler(warning)
	},
	kit: {
		// Pinned to Vercel's Node 24 runtime (matches `engines` in package.json)
		adapter: adapter({ runtime: 'nodejs24.x' }),
		alias: {
			$components: 'src/components',
			$types: 'src/types',
			$stores: 'src/stores'
		},
		prerender: {
			handleMissingId: 'warn',
			entries: [
				'/en', // English version of the library page
				'/ar', // Arabic version of the library page
				'/ar/library', // Arabic version of the library page
				'/en/library', // Arabic version of the library page
				'/',
				'/api/library-items'
			], // Prerender all routes
			handleHttpError: ({ path, referrer, message }) => {
				// Create an array of paths to ignore
				const ignorePaths = ['/', '/api/library-items']
				if (ignorePaths.includes(path)) {
					return
				}
				throw new Error(message)
			}
		}
	}
}

export default config

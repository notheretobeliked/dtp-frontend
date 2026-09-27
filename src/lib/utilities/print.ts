/*
	Safari only prints images that have already loaded, so lazy images further
	down the page come out blank, and `beforeprint` can't hold the print back
	while they load. On printable pages we therefore take over Cmd/Ctrl+P: load
	and decode every image first, then open the print dialog ourselves.

	Printing from the browser menu can't be intercepted. For that path,
	`beforeprint` starts loading the remaining images (so printing again gives a
	complete copy) and, in Safari, flags the copy so a print-only note shows.
	Chrome loads lazy images for printing by itself, so it never needs the note.
*/

const LOAD_TIMEOUT = 30000
const INCOMPLETE_CLASS = 'print-incomplete'

const isSafari = () => /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)

function getImages(root: ParentNode): HTMLImageElement[] {
	return [...root.querySelectorAll('img')].filter((img) => {
		const src = img.getAttribute('src')
		return src && !src.startsWith('data:')
	})
}

function loadEagerly(images: HTMLImageElement[]) {
	for (const img of images) if (img.loading === 'lazy') img.loading = 'eager'
}

function isLoaded(img: HTMLImageElement) {
	return img.complete && img.naturalWidth > 0
}

function whenSettled(img: HTMLImageElement): Promise<void> {
	return new Promise((resolve) => {
		if (img.complete) return resolve()
		img.addEventListener('load', () => resolve(), { once: true })
		img.addEventListener('error', () => resolve(), { once: true })
	})
}

async function loadAllImages(root: ParentNode) {
	const images = getImages(root)
	loadEagerly(images)
	await Promise.race([
		Promise.all(images.map((img) => whenSettled(img).then(() => img.decode().catch(() => {})))),
		new Promise((resolve) => setTimeout(resolve, LOAD_TIMEOUT))
	])
}

/** Returns a cleanup function. */
export function setupPrint(root: ParentNode, onPreparing: (preparing: boolean) => void) {
	let preparing = false

	async function handleKeydown(event: KeyboardEvent) {
		if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return
		if (event.key.toLowerCase() !== 'p') return
		event.preventDefault()
		if (preparing) return

		preparing = true
		onPreparing(true)
		await loadAllImages(root)
		onPreparing(false)
		preparing = false
		// Let the spinner disappear before the dialog opens
		await new Promise(requestAnimationFrame)
		window.print()
	}

	function handleBeforePrint() {
		const images = getImages(root)
		loadEagerly(images)
		const incomplete = isSafari() && images.some((img) => !isLoaded(img))
		document.documentElement.classList.toggle(INCOMPLETE_CLASS, incomplete)
	}

	function handleAfterPrint() {
		document.documentElement.classList.remove(INCOMPLETE_CLASS)
	}

	window.addEventListener('keydown', handleKeydown)
	window.addEventListener('beforeprint', handleBeforePrint)
	window.addEventListener('afterprint', handleAfterPrint)

	return () => {
		window.removeEventListener('keydown', handleKeydown)
		window.removeEventListener('beforeprint', handleBeforePrint)
		window.removeEventListener('afterprint', handleAfterPrint)
		handleAfterPrint()
	}
}

import { writable } from 'svelte/store'

const STORAGE_KEY = 'isInfoPanelOpen'

// Get initial value from localStorage, default to true on desktop, false on mobile
const getInitialValue = (): boolean => {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored !== null) {
			return JSON.parse(stored)
		}
		// Default: open on desktop (>= 1024px), closed on mobile
		return window.innerWidth >= 1024
	}
	return true
}

// Create the store with the initial value
const createInfoPanelStore = () => {
	const { subscribe, set, update } = writable<boolean>(getInitialValue())

	return {
		subscribe,
		set: (value: boolean) => {
			if (typeof window !== 'undefined') {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
			}
			set(value)
		},
		update: (fn: (value: boolean) => boolean) => {
			update((current) => {
				const newValue = fn(current)
				if (typeof window !== 'undefined') {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue))
				}
				return newValue
			})
		},
		toggle: () => {
			update((current) => {
				const newValue = !current
				if (typeof window !== 'undefined') {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue))
				}
				return newValue
			})
		}
	}
}

export const isInfoOpen = createInfoPanelStore()


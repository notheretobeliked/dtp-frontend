/*
	Turns the `acf/exhibition-room` block as WordPress sends it (nullable at
	every level, images as raw media items) into the plain shape the
	ExhibitionRoom component renders.

	A room is a list of cabinets, a cabinet a list of image groups, and each
	group is shown in one of four layouts.
*/

import type { ExhibitionRoom, MediaItem } from '$lib/graphql/generated'

export const GROUP_LAYOUTS = ['miniatures', 'centered', 'animation', 'organic'] as const
export type GroupLayout = (typeof GROUP_LAYOUTS)[number]

export interface RoomImage {
	src: string
	width: number
	height: number
	/** width / height */
	aspectRatio: number
	alt: string
	/** Library reference of the book shown, e.g. "A480" */
	reference: string | null
}

export interface RoomGroup {
	layout: GroupLayout
	shadow: boolean
	images: RoomImage[]
	/** Aspect ratio of the group's widest image */
	widestAspectRatio: number
}

export interface RoomCabinet {
	/** Identifies the cabinet in element ids and anchors */
	slug: string
	nameAr: string
	nameEn: string
	introText: string
	groups: RoomGroup[]
}

export interface Room {
	nameAr: string
	nameEn: string
	introText: string
	cabinets: RoomCabinet[]
}

/** Id of the element holding a cabinet's images */
export const cabinetImagesId = (slug: string) => `images-cabinet-${slug}`

/*
	WordPress caps its image sizes by height: medium is 400px tall, medium_large
	800px. Every layout but miniatures shows images up to 430px tall, so the
	800px file keeps them sharp without fetching the 1400px one.

	Miniatures are 180px wide and the 400px file is about 280px wide for a
	typical cover. That is a little soft on the densest phone screens, but the
	next size up weighs over twice as much and a room can hold more than a
	hundred miniatures.
*/
const IMAGE_SIZES: Record<GroupLayout, string> = {
	miniatures: 'medium',
	centered: 'medium_large',
	animation: 'medium_large',
	organic: 'medium_large'
}

/** `reference` is added to media items by the ExhibitionRoom block in WordPress */
type RoomMediaItem = MediaItem & { reference?: string | null }

interface ImageFile {
	src: string
	width: number
	height: number
}

/** The named WordPress size of an image, or undefined if it was never generated */
function findSize(media: RoomMediaItem, name: string): ImageFile | undefined {
	const size = media.mediaDetails?.sizes?.find((size) => size?.name === name)
	if (!size?.sourceUrl) return undefined
	return { src: size.sourceUrl, width: Number(size.width), height: Number(size.height) }
}

function toImage(media: RoomMediaItem, layout: GroupLayout): RoomImage | null {
	if (!media.sourceUrl) return null

	// WordPress skips sizes larger than the upload, so a missing size means the
	// original is already small enough to use as it is.
	const original: ImageFile = {
		src: media.sourceUrl,
		width: media.mediaDetails?.width ?? 0,
		height: media.mediaDetails?.height ?? 0
	}
	const file = findSize(media, IMAGE_SIZES[layout]) ?? original

	return {
		src: file.src,
		width: file.width,
		height: file.height,
		aspectRatio: file.width && file.height ? file.width / file.height : 1,
		alt: media.altText ?? '',
		reference: media.reference ?? null
	}
}

const isGroupLayout = (value: unknown): value is GroupLayout =>
	GROUP_LAYOUTS.includes(value as GroupLayout)

/** Drops the nulls GraphQL allows in every list */
const present = <T>(items: readonly (T | null | undefined)[] | null | undefined): T[] =>
	(items ?? []).filter((item): item is T => item != null)

/** Groups without a known layout or without images are left out. */
export function buildRoom(room: ExhibitionRoom | null | undefined): Room {
	const cabinets = present(room?.cabinets).map((cabinet): RoomCabinet => {
		const groups = present(cabinet.groups).flatMap((group): RoomGroup[] => {
			const layout = group.layout?.[0]
			if (!isGroupLayout(layout)) return []

			const images = present(group.images?.nodes)
				.map((media) => toImage(media, layout))
				.filter((image) => image !== null)
			if (!images.length) return []

			return [
				{
					layout,
					shadow: group.shadow ?? false,
					images,
					widestAspectRatio: Math.max(...images.map((image) => image.aspectRatio))
				}
			]
		})

		const nameEn = cabinet.nameEn ?? ''
		return {
			slug: nameEn.toLowerCase().replace(/\s+/g, '_'),
			nameAr: cabinet.nameAr ?? '',
			nameEn,
			introText: cabinet.introText ?? '',
			groups
		}
	})

	return {
		nameAr: room?.nameAr ?? '',
		nameEn: room?.nameEn ?? '',
		introText: room?.introText ?? '',
		cabinets
	}
}

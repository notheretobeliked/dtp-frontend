<script lang="ts">
	interface Props {
		block: AcfExhibitionRoom
	}

	let { block }: Props = $props()

	import { preventDefault } from 'svelte/legacy'

	import { onDestroy, onMount } from 'svelte'
	import type { AcfExhibitionRoom, MediaItem } from '$lib/graphql/generated'
	import type { ObserverEventDetails, ScrollDirection, Options } from 'svelte-inview'
	import { language } from '$stores/language'

	import { fade } from 'svelte/transition'
	import CoreHeading from './CoreHeading.svelte'
	import Image from '$components/Image.svelte'
	import ImageSkeleton from '$components/atoms/ImageSkeleton.svelte'
	import { activeBook } from '$stores/activeBook'
	import { inview } from 'svelte-inview'
	let isInView: boolean = $state()
	let scrollDirection: Direction | undefined // Update this line

	// Loading state management
	let imageLoadStates = $state<Record<string, boolean>>({})
	let allImagesLoaded = $state(false)
	let initialBatchLoaded = $state(false)

	// Helper to generate unique image keys
	function getImageKey(cabinetIndex: number, groupIndex: number, imageIndex: number): string {
		return `c${cabinetIndex}_g${groupIndex}_i${imageIndex}`
	}

	// Track when images are loaded
	$effect(() => {
		const totalImages = block?.exhibitionRoom?.cabinets?.reduce((total, cabinet) => 
			total + (cabinet?.groups?.reduce((groupTotal, group) => 
				groupTotal + (group?.images?.nodes?.length || 0), 0) || 0), 0) || 0
		
		const loadedImages = Object.values(imageLoadStates).filter(Boolean).length
		const wasAllLoaded = allImagesLoaded
		allImagesLoaded = loadedImages === totalImages && totalImages > 0
		
		// Calculate initial batch (first cabinet's first group, or first 8 images, whichever is smaller)
		const firstCabinet = block?.exhibitionRoom?.cabinets?.[0]
		const firstGroup = firstCabinet?.groups?.[0]
		const initialBatchSize = Math.min(
			firstGroup?.images?.nodes?.length || 8, 
			8  // Show progress bar until at least 8 images or first group is loaded
		)
		
		const wasInitialLoaded = initialBatchLoaded
		initialBatchLoaded = loadedImages >= initialBatchSize && totalImages > 0
		
		// Debug logging
		if (loadedImages !== totalImages || !wasAllLoaded || !wasInitialLoaded) {
			console.log(`Image loading progress: ${loadedImages}/${totalImages} (initial batch: ${loadedImages}/${initialBatchSize})`, {
				loadedImages,
				totalImages,
				initialBatchSize,
				allImagesLoaded,
				initialBatchLoaded,
				imageLoadStates: Object.keys(imageLoadStates).length
			})
		}
	})

	// Process groups to update layout based on aspect ratio
	if (block?.exhibitionRoom?.cabinets) {
		block.exhibitionRoom.cabinets.forEach((cabinet) => {
			if (cabinet?.groups) {
				cabinet.groups?.forEach((group) => {
					if (!group || !group.layout) return

					// Add aspect ratio to each image for reuse
					if (group.images?.nodes?.length) {
						group.images.nodes.forEach((image: any) => {
							if (!image) return;
							const largeSize = image.mediaDetails?.sizes?.find(
								(size: any) => size && size.name === 'large'
							);
							if (largeSize?.width && largeSize?.height) {
								// Store aspect ratio on the image object
								image.aspectRatio = parseInt(largeSize.width) / parseInt(largeSize.height);
							} else {
								// Default to square if no dimensions
								image.aspectRatio = 1;
							}
						});
					}

					if (group?.layout[0] === 'organic' && group.images?.nodes?.[0]) {
						// Skip landscape check if there are only 2 images
						if (group.images.nodes.length <= 2) return

						const firstImage = group.images.nodes[0]
						const largeSize = firstImage.mediaDetails?.sizes?.find(
							(size) => size && size.name === 'large'
						)

						if (largeSize?.width && largeSize?.height) {
							const firstAspectRatio = parseInt(largeSize.width) / parseInt(largeSize.height)

							// More lenient check - consider images close to square (ratio > 0.9) as potential landscape books
							if (firstAspectRatio > 0.9) {
								// Check next two images if they exist
								const nextImages = group.images.nodes.slice(1, 3) as MediaItem[]
								const isLandscapeBook = nextImages.some((image) => {
									const imgLargeSize = image?.mediaDetails?.sizes?.find(
										(size) => size?.name === 'large'
									)
									if (imgLargeSize?.width && imgLargeSize?.height) {
										const aspectRatio = parseInt(imgLargeSize.width) / parseInt(imgLargeSize.height)
										// Lower threshold to detect more books as landscape
										return aspectRatio > 1.3 // Less restrictive than 1.8
									}
									return false
								})

								if (isLandscapeBook) {
									group.layout[0] = 'organic-landscape'
								}
							}
						}
					}
				})
			}
		})
	}
	const options: Options = {
		rootMargin: '-50px',
		unobserveOnEnter: true
	}

	const handleCabinetLinkClick = (e: Event, cabinetId: string) => {
		e.preventDefault()
		if (cabinetId === '#') {
			window.scrollTo({ top: 0, behavior: 'smooth' })
		} else {
			const element = document.getElementById(`images-cabinet-${cabinetId}`)
			if (element) {
				element.scrollIntoView({ behavior: 'smooth' })
			}
		}
	}

	const handleChange = ({ detail }: CustomEvent<ObserverEventDetails>) => {
		isInView = detail.inView
		scrollDirection = detail.scrollDirection.vertical
	}

	const handleHeaderInView = ({ detail }: CustomEvent<ObserverEventDetails>) => {
		if (detail.inView) {
			lastVisibleSection = 'room-intro'
			const introElement = document.getElementById('room-intro')
			if (introElement && isInfoOpen) {
				introElement.scrollIntoView({ behavior: 'smooth' })
			}
		}
	}

	const handleCabinetInView =
		(cabinetId: string) =>
		({ detail }: CustomEvent<ObserverEventDetails>) => {
			if (detail.inView) {
				lastVisibleSection = `text-${cabinetId}`
				const textElement = document.getElementById(`text-${cabinetId}`)
				if (textElement && isInfoOpen) {
					textElement.scrollIntoView({ behavior: 'smooth' })
				}
			}
		}
	// Add interval for animation
	let animationInterval: ReturnType<typeof setInterval> = $state()

	let currentImageIndex = $state(0)
	let previousImageIndex = $state(0)

	const startAnimation = (nodes: any[]) => {
		if (animationInterval) clearInterval(animationInterval)
		animationInterval = setInterval(() => {
			previousImageIndex = currentImageIndex
			currentImageIndex = (currentImageIndex + 1) % nodes.length
		}, 2000) // Changed to 3 seconds to give time for fade
	}

	import { fly } from 'svelte/transition'

	let infoDiv: HTMLElement
	let isInfoOpen = $state(false)
	let lastVisibleSection: string = 'room-intro' // Default to room intro

	let buttonPosition: number

	const updateButtonPosition = () => {
		if (infoDiv) {
			const rect = infoDiv.getBoundingClientRect()
			buttonPosition = rect.left
		}
	}

	const toggleInfo = () => {
		isInfoOpen = !isInfoOpen
		if (isInfoOpen) {
			setTimeout(() => {
				const element = document.getElementById(lastVisibleSection)
				if (element) {
					element.scrollIntoView({ behavior: 'smooth' })
				}
			}, 50) // Slightly longer than the fly transition duration (800ms)
		}
	}

	// Clean up interval on component destroy

	onDestroy(() => {
		if (animationInterval) clearInterval(animationInterval)
	})

	// Preload critical images and pre-calculate dimensions
	onMount(() => {
		updateButtonPosition()
		window.addEventListener('resize', updateButtonPosition)

		// Preload first cabinet's images
		const firstCabinet = block?.exhibitionRoom?.cabinets?.[0]
		if (firstCabinet?.groups?.[0]?.images?.nodes) {
			firstCabinet.groups[0].images.nodes.slice(0, 3).forEach((image: any) => {
				if (image?.sourceUrl) {
					const img = document.createElement('img')
					img.src = image.sourceUrl
				}
			})
		}

		// Pre-calculate heights for organic-landscape layouts
		const estimatedWidth = window.innerWidth < 1024 ? window.innerWidth * 0.9 : window.innerWidth * 0.45
		
		block?.exhibitionRoom?.cabinets?.forEach((cabinet, cabinetIndex) => {
			cabinet?.groups?.forEach((group, groupIndex) => {
				if (group?.layout?.[0] === 'organic-landscape' && group?.images?.nodes?.length) {
					const groupKey = getGroupId(cabinetIndex, groupIndex)
					groupHeights[groupKey] = precalculateGroupHeight(group, estimatedWidth)
					// Don't set normalized to true immediately - wait for DOM measurements
					// normalizedGroups[groupKey] = true
				}
			})
		})

		// Setup actual DOM measurements after a delay
		setTimeout(() => {
			if (!block?.exhibitionRoom?.cabinets) return
			
			block.exhibitionRoom.cabinets.forEach((cabinet, cabinetIndex) => {
				if (!cabinet?.groups) return
				
				cabinet.groups.forEach((group, groupIndex) => {
					if (!group?.layout || group.layout[0] !== 'organic-landscape' || !group.images?.nodes?.length) return
					
					const groupKey = getGroupId(cabinetIndex, groupIndex)
					
					const containers = document.querySelectorAll(`.group-${groupKey} .img-container`)
					if (containers.length === 0) {
						// If no containers found, use pre-calculated height and show
						normalizedGroups[groupKey] = true
						return
					}
					
					const calculatedHeights: number[] = []
					
					containers.forEach((container, i) => {
						if (!group?.images?.nodes) return
                        
						const imageIndex = i === containers.length - 1 && containers.length > 3 
							? group.images.nodes.length - 1
							: i === 0 ? 0 : (i < 3 ? i : i - 1)
							
						const image = group.images.nodes[imageIndex]
						const aspectRatio = getImageAspectRatio(image)
						const containerWidth = (container as HTMLElement).offsetWidth
						
						const expectedHeight = containerWidth / aspectRatio
						calculatedHeights.push(expectedHeight)
					})
					
					if (calculatedHeights.length > 0) {
						const minHeight = Math.min(...calculatedHeights)
						// Only update if the new calculation is significantly different
						if (Math.abs(groupHeights[groupKey] - minHeight) > 10) {
							groupHeights[groupKey] = minHeight
						}
					}
					
					// Always show the group after measurement
					normalizedGroups[groupKey] = true
				})
			})
		}, 400)

		return () => window.removeEventListener('resize', updateButtonPosition)
	})

	const handleImageClick = (reference: string) => {
		if (!reference) return
		$activeBook = reference
		console.log('Set active book reference:', reference)
	}

	// Action to setup image load detection
	function setupImageLoad(node: HTMLElement, imageKey: string) {
		const img = node.querySelector('img');
		if (img && !img.hasAttribute('data-onload-set')) {
			img.setAttribute('data-onload-set', 'true');
			img.onload = () => imageLoadStates[imageKey] = true;
			if (img.complete) imageLoadStates[imageKey] = true;
		}
		
		return {
			destroy() {
				// Cleanup if needed
			}
		}
	}

	// Helper function to get aspect ratio from image - now uses cached value if available
	function getImageAspectRatio(image: any): number {
		// Return cached aspect ratio if available
		if (image.aspectRatio) return image.aspectRatio;
		
		// Otherwise calculate it
		const largeSize = image?.mediaDetails?.sizes?.find((size: any) => size?.name === 'large');
		if (!largeSize?.width || !largeSize?.height) return 1; // Default to square if no dimensions
		
		// Store for future use
		image.aspectRatio = parseInt(largeSize.width) / parseInt(largeSize.height);
		return image.aspectRatio;
	}
	
	// Replaced getImageOrientation function to use cached aspect ratio
	function getImageOrientation(image: any): 'portrait' | 'landscape' | 'square' {
		const aspectRatio = getImageAspectRatio(image);
		
		if (aspectRatio > 1.1) return 'landscape';
		if (aspectRatio < 0.9) return 'portrait';
		return 'square'; // For images that are approximately square
	}
	
	// Also update the getImageHeightClass function to use the cached aspect ratio
	function getImageHeightClass(image: any, groupLayout: string): string {
		const aspectRatio = getImageAspectRatio(image);

		if (groupLayout === 'organic-landscape') {
			// If aspect ratio is less than 1.7:1, use smaller height
			return aspectRatio < 1.7 ? 'h-[300px] lg:h-[430px]' : 'h-auto lg:h-[250px]';
		} else {
			// In normal organic layout, use the original heights
			return 'h-[300px] lg:h-[430px]';
		}
	}

	// Precalculate group height helper
	function precalculateGroupHeight(group: any, containerWidth: number = 400): number {
		if (!group?.images?.nodes?.length) return 300
		
		const heights = group.images.nodes.map((image: any) => {
			const aspectRatio = getImageAspectRatio(image)
			return containerWidth / aspectRatio
		})
		
		return Math.min(...heights)
	}
	
	// Add this effect for each animation group
	$effect(() => {
		// For each animation section that needs to be started
		const groups = block?.exhibitionRoom?.cabinets?.flatMap(c => 
			c?.groups?.filter(g => g?.layout?.[0] === 'animation') ?? []
		) ?? [];
		
		groups.forEach(group => {
			if (group?.images?.nodes?.length && !animationInterval) {
				startAnimation(group.images.nodes);
			}
		});
		
		// Cleanup when component unmounts
		return () => {
			if (animationInterval) {
				clearInterval(animationInterval);
				animationInterval = undefined;
			}
		};
	});

	// Image height normalization for organic-landscape layout
	let normalizedGroups = $state<Record<string, boolean>>({});
	let groupHeights = $state<Record<string, number>>({});
	
	function getGroupId(cabinetIndex: number, groupIndex: number): string {
		return `cabinet${cabinetIndex}_group${groupIndex}`;
	}
</script>

<!-- Loading progress bar -->
{#if !initialBatchLoaded}
	<div class="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
		<div 
			class="h-full bg-black transition-all duration-300"
			style="width: {(Object.values(imageLoadStates).filter(Boolean).length / Math.max(Math.min(block?.exhibitionRoom?.cabinets?.[0]?.groups?.[0]?.images?.nodes?.length || 8, 8), 1)) * 100}%"
		></div>
	</div>
{/if}

<div class="w-full flex flex-row">
	<div class="images">
		<header
			class="mb-[200px] mt-[200px]"
			use:inview={{
				rootMargin: '0px 0px -80% 0px', // Triggers when header is near top
				unobserveOnEnter: false
			}}
			oninview_change={handleHeaderInView}
		>
			{#if block?.exhibitionRoom?.nameAr}
				<CoreHeading
					block={{
						attributes: {
							content: block.exhibitionRoom.nameAr,
							level: 1,
							fontSize: '4xl',
							textColor: null,
							textAlign: 'center',
							fontFamily: 'manchette',
							className: '!mb-0'
						}
					}}
				/>
			{/if}
			{#if block?.exhibitionRoom?.nameEn && $language != 'ar'}
				<CoreHeading
					block={{
						attributes: {
							content: block.exhibitionRoom.nameEn,
							level: 1,
							fontSize: '4xl',
							textColor: null,
							textAlign: 'center',
							fontFamily: null
						}
					}}
				/>
			{/if}
		</header>

		{#if block?.exhibitionRoom?.cabinets}
			{#each block.exhibitionRoom.cabinets as cabinet, cabinetIndex}
				{#if cabinet}
					<div
						class="mb-8"
						id="images-cabinet-{cabinet.nameEn?.toLowerCase().replace(/\s+/g, '_')}"
						use:inview={{
							rootMargin: '-20% 0px -60% 0px', // Adjust these values to control when the scroll triggers
							unobserveOnEnter: false // Keep observing to handle scrolling back up
						}}
						oninview_change={handleCabinetInView(
							`cabinet-${cabinet.nameEn?.toLowerCase().replace(/\s+/g, '_')}`
						)}
					>
						<header class="mb-12 top-[20vh] z-30">
							{#if cabinet.nameAr}
								<CoreHeading
									block={{
										attributes: {
											content: cabinet.nameAr,
											level: 1,
											fontSize: null,
											textColor: null,
											textAlign: 'center',
											fontFamily: 'manchette',
											className: '!mb-0'
										}
									}}
								/>
							{/if}
							{#if cabinet.nameEn && $language != 'ar'}
								<CoreHeading
									block={{
										attributes: {
											content: cabinet.nameEn,
											level: 1,
											fontSize: null,
											textColor: null,
											textAlign: 'center',
											fontFamily: 'boogy'
										}
									}}
								/>
							{/if}
						</header>

						{#if cabinet.introText}
							<div class="basestyles {$language === 'ar' ? 'ar' : ''} hidden">
								>
								{@html cabinet.introText}
							</div>
						{/if}

						{#if cabinet.groups}
							{#each cabinet.groups as group, groupIndex}
								{#if group?.layout}
									{#if group.layout[0] === 'miniatures'}
										<div
											class="flex flex-row flex-wrap gap-2 mb-[200px] justify-center layout-miniatures"
											use:inview={cabinetIndex === 0 && groupIndex === 0 ? undefined : options}
											oninview_change={cabinetIndex === 0 && groupIndex === 0
												? undefined
												: handleChange}
										>
											{#if group.images?.nodes}
												{#each group.images.nodes as image, i}
													{@const imageKey = getImageKey(cabinetIndex, groupIndex, i)}
													<div
														class="relative w-[180px] hover:scale-105 transition-all duration-500 {cabinetIndex ===
															0 && groupIndex === 0
															? 'scale-100 opacity-100 translate-y-0'
															: isInView
																? 'scale-100 opacity-100 translate-y-0'
																: 'scale-100 opacity-100 translate-y-0'}"
														onclick={() => handleImageClick(image.reference)}
														onkeydown={(e) =>
															e.key === 'Enter' && handleImageClick(image.reference)}
														role="button"
														tabindex="0"
														class:cursor-pointer={image.reference}
													>
														{#if !imageLoadStates[imageKey]}
															<ImageSkeleton 
																aspectRatio={getImageAspectRatio(image)}
																className="w-[180px] h-[180px]"
															/>
														{/if}
														<div 
															class="transition-opacity duration-300 {imageLoadStates[imageKey] ? 'opacity-100' : 'opacity-0'}" 
															class:absolute={!imageLoadStates[imageKey]} 
															class:inset-0={!imageLoadStates[imageKey]}
															use:setupImageLoad={imageKey}
														>
															<Image
																imageObject={image}
																imageSize="thumbnail"
																shadow={group.shadow}
																fit="contain"
															/>
														</div>
													</div>
												{/each}
											{/if}
										</div>
									{/if}

									{#if group.layout[0] === 'centered'}
										<div
											class="flex flex-col gap-[200px] mb-[100px] lg:mb-[200px] items-center layout-centered"
											use:inview={options}
											oninview_change={handleChange}
										>
											{#if group.images?.nodes}
												{#each group.images.nodes as image, i}
													{@const imageKey = getImageKey(cabinetIndex, groupIndex, i)}
													<div
														class="{getImageHeightClass(
															image,
															group.layout[0]
														)} hover:scale-[101%] transition-all duration-200 {isInView
															? 'scale-100 opacity-100 translate-y-0'
															: 'scale-100 opacity-100 translate-y-0'}"
														onclick={() => handleImageClick(image.reference)}
														onkeydown={(e) =>
															e.key === 'Enter' && handleImageClick(image.reference)}
														role="button"
														tabindex="0"
														class:cursor-pointer={image.reference}
													>
														{#if !imageLoadStates[imageKey]}
															<ImageSkeleton 
																aspectRatio={getImageAspectRatio(image)}
																className="w-full h-full"
															/>
														{/if}
														<div 
															class="transition-opacity duration-300 {imageLoadStates[imageKey] ? 'opacity-100' : 'opacity-0'}" 
															class:absolute={!imageLoadStates[imageKey]} 
															class:inset-0={!imageLoadStates[imageKey]}
															use:setupImageLoad={imageKey}
														>
															<Image
																imageObject={image}
																imageSize="large"
																fit="contain"
																shadow={group.shadow}
															/>
														</div>
													</div>
												{/each}
											{/if}
										</div>
									{/if}

									{#if group.layout[0] === 'animation'}
										<div class="flex flex-col mt-[200px] mb-[200px] items-center layout-centered">
											{#if group.images?.nodes?.length > 0}
												<div class="relative h-[300px] lg:h-[527px] w-full lg:max-w-[800px]">
													{#key previousImageIndex}
														{@const prevImageKey = getImageKey(cabinetIndex, groupIndex, previousImageIndex)}
														<div class="absolute inset-0 flex justify-center w-full h-full z-10">
															<div class="relative h-full flex justify-center" use:setupImageLoad={prevImageKey}>
																<Image
																	imageObject={group.images.nodes[previousImageIndex]}
																	imageSize="large"
																	fit="contain"
																/>
															</div>
														</div>
													{/key}
													{#key currentImageIndex}
														{@const currImageKey = getImageKey(cabinetIndex, groupIndex, currentImageIndex)}
														<div
															class="absolute inset-0 flex justify-center w-full h-full z-20"
															transition:fade={{ duration: 200 }}
															onclick={() =>
																handleImageClick(group.images.nodes[currentImageIndex]?.reference)}
															onkeydown={(e) =>
																e.key === 'Enter' &&
																handleImageClick(group.images.nodes[currentImageIndex]?.reference)}
															role="button"
															tabindex="0"
															class:cursor-pointer={group.images.nodes[currentImageIndex]
																?.reference}
														>
															<div class="relative h-full flex justify-center" use:setupImageLoad={currImageKey}>
																<Image
																	imageObject={group.images.nodes[currentImageIndex]}
																	imageSize="large"
																	fit="contain"
																/>
															</div>
														</div>
													{/key}
												</div>
											{/if}
										</div>
									{/if}

									{#if group.layout[0] === 'organic' || group.layout[0] === 'organic-landscape'}
										<div 
											class="lg:grid lg:grid-cols-2 gap-4 mb-[200px] layout-{group.layout[0]} group-{getGroupId(cabinetIndex, groupIndex)} transition-opacity duration-500" 
											class:invisible={group.layout[0] === 'organic-landscape' && !normalizedGroups[getGroupId(cabinetIndex, groupIndex)]}
											class:opacity-0={group.layout[0] === 'organic-landscape' && !normalizedGroups[getGroupId(cabinetIndex, groupIndex)]}
											class:opacity-100={group.layout[0] !== 'organic-landscape' || normalizedGroups[getGroupId(cabinetIndex, groupIndex)]}
										>
											{#if group.images?.nodes?.length > 0}
												<!-- First image -->
												{@const firstImageKey = getImageKey(cabinetIndex, groupIndex, 0)}
												<div class="lg:col-span-2 flex justify-center">
													<div
														class={`w-full hover:scale-[101%] transition-all duration-200 img-container flex justify-center ${
															group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																? ''
																: getImageHeightClass(group.images.nodes[0], group.layout[0])
														}`}
														style={group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
															? `height: ${groupHeights[getGroupId(cabinetIndex, groupIndex)]}px`
															: ''}
														onclick={() => handleImageClick(group.images.nodes[0]?.reference)}
														onkeydown={(e) =>
															e.key === 'Enter' &&
															handleImageClick(group.images.nodes[0]?.reference)}
														role="button"
														tabindex="0"
														class:cursor-pointer={group.images.nodes[0]?.reference}
													>
														{#if !imageLoadStates[firstImageKey]}
															<ImageSkeleton 
																aspectRatio={getImageAspectRatio(group.images.nodes[0])}
																className="w-full h-full"
															/>
														{/if}
														<img 
															src={group.images.nodes[0]?.sourceUrl}
															alt={group.images.nodes[0]?.altText || ''}
															style="height: 100%; width: auto; object-fit: contain;"
															class="img-content drop-shadow-lg transition-opacity duration-300 {imageLoadStates[firstImageKey] ? 'opacity-100' : 'opacity-0'}"
															onload={() => imageLoadStates[firstImageKey] = true}
															loading="lazy"
														/>
													</div>
												</div>

												<!-- For 2 images, show the second image centered -->
												{#if group.images.nodes.length === 2}
													{@const secondImageKey = getImageKey(cabinetIndex, groupIndex, 1)}
													<div class="lg:col-span-2 flex justify-center">
														<div
															class={`w-full hover:scale-[101%] transition-all duration-200 img-container flex justify-center ${
																group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																	? ''
																	: getImageHeightClass(group.images.nodes[1], group.layout[0])
															}`}
															style={group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																? `height: ${groupHeights[getGroupId(cabinetIndex, groupIndex)]}px`
																: ''}
															onclick={() => handleImageClick(group.images.nodes[1]?.reference)}
															onkeydown={(e) =>
																e.key === 'Enter' &&
																handleImageClick(group.images.nodes[1]?.reference)}
															role="button"
															tabindex="0"
															class:cursor-pointer={group.images.nodes[1]?.reference}
														>
															{#if !imageLoadStates[secondImageKey]}
																<ImageSkeleton 
																	aspectRatio={getImageAspectRatio(group.images.nodes[1])}
																	className="w-full h-full"
																/>
															{/if}
															<img 
																src={group.images.nodes[1]?.sourceUrl}
																alt={group.images.nodes[1]?.altText || ''}
																style="height: 100%; width: auto; object-fit: contain;"
																class="img-content drop-shadow-lg transition-opacity duration-300 {imageLoadStates[secondImageKey] ? 'opacity-100' : 'opacity-0'}"
																onload={() => imageLoadStates[secondImageKey] = true}
																loading="lazy"
															/>
														</div>
													</div>
													<!-- For 3 images, show remaining images in alternating layout -->
												{:else if group.images.nodes.length === 3}
													{#each group.images.nodes.slice(1) as image, i}
														{@const imgKey = getImageKey(cabinetIndex, groupIndex, i + 1)}
														{#if i % 2 === 0}
															<div class="lg:col-start-1 lg:row-span-2 flex justify-center lg:justify-end">
																<div
																	class={`w-full hover:scale-[101%] transition-all duration-200 img-container flex justify-center lg:justify-end ${
																		group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																			? ''
																			: getImageHeightClass(image as any, group.layout[0])
																	}`}
																	style={group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																		? `height: ${groupHeights[getGroupId(cabinetIndex, groupIndex)]}px`
																		: ''}
																	onclick={() => handleImageClick((image as any)?.reference)}
																	onkeydown={(e) =>
																		e.key === 'Enter' && handleImageClick((image as any)?.reference)}
																	role="button"
																	tabindex="0"
																	class:cursor-pointer={(image as any)?.reference}
																>
																	{#if !imageLoadStates[imgKey]}
																		<ImageSkeleton 
																			aspectRatio={getImageAspectRatio(image)}
																			className="w-full h-full"
																		/>
																	{/if}
																	<img 
																		src={(image as any)?.sourceUrl}
																		alt={(image as any)?.altText || ''}
																		style="height: 100%; width: auto; object-fit: contain;"
																		class="img-content drop-shadow-lg transition-opacity duration-300 {imageLoadStates[imgKey] ? 'opacity-100' : 'opacity-0'}"
																		onload={() => imageLoadStates[imgKey] = true}
																		loading="lazy"
																	/>
																</div>
															</div>
															<div class="hidden lg:block col-start-2 row-span-1">
																<div class="h-[200px]"></div>
															</div>
														{:else}
															<div
																class="col-start-2 lg:row-span-2 flex justify-center lg:justify-start"
															>
																<div
																	class={`w-full hover:scale-[101%] transition-all duration-200 img-container flex justify-center lg:justify-start ${
																		group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																			? ''
																			: getImageHeightClass(image as any, group.layout[0])
																	}`}
																	style={group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																		? `height: ${groupHeights[getGroupId(cabinetIndex, groupIndex)]}px`
																		: ''}
																	onclick={() => handleImageClick((image as any)?.reference)}
																	onkeydown={(e) =>
																		e.key === 'Enter' && handleImageClick((image as any)?.reference)}
																	role="button"
																	tabindex="0"
																	class:cursor-pointer={(image as any)?.reference}
																>
																	{#if !imageLoadStates[imgKey]}
																		<ImageSkeleton 
																			aspectRatio={getImageAspectRatio(image)}
																			className="w-full h-full"
																		/>
																	{/if}
																	<img 
																		src={(image as any)?.sourceUrl}
																		alt={(image as any)?.altText || ''}
																		style="height: 100%; width: auto; object-fit: contain;"
																		class="img-content drop-shadow-lg transition-opacity duration-300 {imageLoadStates[imgKey] ? 'opacity-100' : 'opacity-0'}"
																		onload={() => imageLoadStates[imgKey] = true}
																		loading="lazy"
																	/>
																</div>
															</div>
														{/if}
													{/each}
													<!-- For 4+ images -->
												{:else}
													{#each group.images.nodes.slice(1, -1) as image, i}
														{@const imgKey = getImageKey(cabinetIndex, groupIndex, i + 1)}
														{#if i % 2 === 0}
															<!-- Even indexed images (2nd, 4th, etc.) -->
															<div
																class="lg:col-start-1 lg:row-span-2 flex justify-center lg:justify-end"
															>
																<div
																	class={`w-full hover:scale-[101%] transition-all duration-200 img-container flex justify-center lg:justify-end ${
																		group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																			? ''
																			: getImageHeightClass(image as any, group.layout[0])
																	}`}
																	style={group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																		? `height: ${groupHeights[getGroupId(cabinetIndex, groupIndex)]}px`
																		: ''}
																	onclick={() => handleImageClick((image as any)?.reference)}
																	onkeydown={(e) =>
																		e.key === 'Enter' && handleImageClick((image as any)?.reference)}
																	role="button"
																	tabindex="0"
																	class:cursor-pointer={(image as any)?.reference}
																>
																	{#if !imageLoadStates[imgKey]}
																		<ImageSkeleton 
																			aspectRatio={getImageAspectRatio(image)}
																			className="w-full h-full"
																		/>
																	{/if}
																	<img 
																		src={(image as any)?.sourceUrl}
																		alt={(image as any)?.altText || ''}
																		style="height: 100%; width: auto; object-fit: contain;"
																		class="img-content drop-shadow-lg transition-opacity duration-300 {imageLoadStates[imgKey] ? 'opacity-100' : 'opacity-0'}"
																		onload={() => imageLoadStates[imgKey] = true}
																		loading="lazy"
																	/>
																</div>
															</div>
															<!-- Spacer -->
															<div class="col-start-2 row-span-1">
																<div class="lg:h-[140px]"></div>
															</div>
														{:else}
															<!-- Odd indexed images (3rd, 5th, etc.) -->
															<div
																class="col-start-2 lg:row-span-2 flex justify-center lg:justify-start"
															>
																<div
																	class={`w-full hover:scale-[101%] transition-all duration-200 img-container flex justify-center lg:justify-start ${
																		group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																			? ''
																			: getImageHeightClass(image as any, group.layout[0])
																	}`}
																	style={group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																		? `height: ${groupHeights[getGroupId(cabinetIndex, groupIndex)]}px`
																		: ''}
																	onclick={() => handleImageClick((image as any)?.reference)}
																	onkeydown={(e) =>
																		e.key === 'Enter' && handleImageClick((image as any)?.reference)}
																	role="button"
																	tabindex="0"
																	class:cursor-pointer={(image as any)?.reference}
																>
																	{#if !imageLoadStates[imgKey]}
																		<ImageSkeleton 
																			aspectRatio={getImageAspectRatio(image)}
																			className="w-full h-full"
																		/>
																	{/if}
																	<img 
																		src={(image as any)?.sourceUrl}
																		alt={(image as any)?.altText || ''}
																		style="height: 100%; width: auto; object-fit: contain;"
																		class="img-content drop-shadow-lg transition-opacity duration-300 {imageLoadStates[imgKey] ? 'opacity-100' : 'opacity-0'}"
																		onload={() => imageLoadStates[imgKey] = true}
																		loading="lazy"
																	/>
																</div>
															</div>
															<!-- Spacer -->
															<div class="lg:col-start-1 row-span-1">
																<div
																	class="{group.layout[0] === 'organic-landscape'
																		? 'lg:h-[100px]'
																		: 'lg:h-[140px]'} "
																></div>
															</div>
														{/if}
													{/each}

													<!-- Final centered image (only if more than 3 images) -->
													{@const lastImageKey = getImageKey(cabinetIndex, groupIndex, group.images.nodes.length - 1)}
													<div class="lg:col-span-2 flex justify-center">
														<div
															class={`w-full hover:scale-[101%] transition-all duration-200 img-container flex justify-center ${
																group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																	? ''
																	: getImageHeightClass(group.images.nodes[group.images.nodes.length - 1], group.layout[0])
															}`}
															style={group.layout[0] === 'organic-landscape' && normalizedGroups[getGroupId(cabinetIndex, groupIndex)]
																? `height: ${groupHeights[getGroupId(cabinetIndex, groupIndex)]}px`
																: ''}
															onclick={() =>
																handleImageClick(
																	group.images.nodes[group.images.nodes.length - 1]?.reference
																)}
															onkeydown={(e) =>
																e.key === 'Enter' &&
																handleImageClick(
																	group.images.nodes[group.images.nodes.length - 1]?.reference
																)}
															role="button"
															tabindex="0"
															class:cursor-pointer={group.images.nodes[
																group.images.nodes.length - 1
															]?.reference}
														>
															{#if !imageLoadStates[lastImageKey]}
																<ImageSkeleton 
																	aspectRatio={getImageAspectRatio(group.images.nodes[group.images.nodes.length - 1])}
																	className="w-full h-full"
																/>
															{/if}
															<img 
																src={group.images.nodes[group.images.nodes.length - 1]?.sourceUrl}
																alt={group.images.nodes[group.images.nodes.length - 1]?.altText || ''}
																style="height: 100%; width: auto; object-fit: contain;"
																class="img-content drop-shadow-lg transition-opacity duration-300 {imageLoadStates[lastImageKey] ? 'opacity-100' : 'opacity-0'}"
																onload={() => imageLoadStates[lastImageKey] = true}
																loading="lazy"
															/>
														</div>
													</div>
												{/if}
											{/if}
										</div>
									{/if}
								{/if}
							{/each}
						{/if}
					</div>
				{/if}
			{/each}
		{/if}
	</div>
	{#if isInfoOpen}
		<div
			transition:fly={{ x: 500, duration: 800 }}
			class="fixed right-0 top-0 max-w-[500px] z-30 {$language === 'ar' ? 'dir-rtl' : ''} "
		>
			<button
				class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white-pure rounded-full border border-black flex items-center justify-center hover:scale-105 transition-all duration-300 z-30"
				style="left: 0"
				onclick={toggleInfo}
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					class="transition-transform duration-300 {isInfoOpen ? '' : 'rotate-45'}"
				>
					<path d="M1 1L13 13M1 13L13 1" stroke="black" stroke-width="1" />
				</svg>
			</button>

			<div class="text bg-white-off right-0 top-0 pt-[100px] px-12 overflow-y-scroll h-screen z-30">
				<div class="pt-16" id="room-intro">
					<a href="#" onclick={preventDefault((e) => handleCabinetLinkClick(e, '#'))}>
						{#if block.exhibitionRoom.nameAr}
							<CoreHeading
								block={{
									attributes: {
										content: block.exhibitionRoom.nameAr,
										level: 1,
										fontSize: null,
										textColor: null,
										textAlign: 'center',
										fontFamily: 'manchette',
										className: $language === 'ar' ? 'mb-4' : '!mb-0'
									}
								}}
							/>
						{/if}
						{#if block.exhibitionRoom.nameEn && $language != 'ar'}
							<CoreHeading
								block={{
									attributes: {
										content: block.exhibitionRoom.nameEn,
										level: 1,
										fontSize: null,
										textColor: null,
										textAlign: 'center',
										fontFamily: null
									}
								}}
							/>
						{/if}
					</a>
					{#if block.exhibitionRoom.introText}
						<div class="basestyles introtext {$language === 'ar' ? 'ar' : ''}">
							{@html block.exhibitionRoom.introText}
						</div>
					{/if}
				</div>
				{#each block.exhibitionRoom.cabinets as cabinet, i}
					<div
						class="mt-8 pt-24 pb-24 {i === block.exhibitionRoom.cabinets.length - 1
							? 'min-h-screen'
							: ''}"
						id="text-cabinet-{cabinet.nameEn?.toLowerCase().replace(/\s+/g, '_')}"
					>
						<header>
							<a
								href="#images-cabinet-{cabinet.nameEn?.toLowerCase().replace(/\s+/g, '_')}"
								onclick={preventDefault((e) =>
									handleCabinetLinkClick(e, cabinet.nameEn?.toLowerCase().replace(/\s+/g, '_'))
								)}
							>
								{#if cabinet.nameAr}
									<CoreHeading
										block={{
											attributes: {
												content: cabinet.nameAr,
												level: 1,
												fontSize: 'xl',
												textColor: null,
												textAlign: 'center',
												fontFamily: 'manchette',
												className: $language === 'ar' ? 'mb-2' : '!mb-0'
											}
										}}
									/>
								{/if}
								{#if cabinet.nameEn && $language != 'ar'}
									<CoreHeading
										block={{
											attributes: {
												content: cabinet.nameEn,
												level: 1,
												fontSize: 'xl',
												textColor: null,
												textAlign: 'center',
												fontFamily: null
											}
										}}
									/>
								{/if}
							</a>
						</header>

						{#if cabinet.introText}
							<div class="basestyles {$language === 'ar' ? 'ar' : ''}">
								{@html cabinet.introText}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div transition:fly={{ x: 500, duration: 500 }}>
			<button
				class="fixed top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white-pure rounded-full border border-black flex items-center justify-center hover:scale-105 transition-all duration-300 3-40"
				style="right: 0px"
				onclick={toggleInfo}
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					class="transition-transform duration-300 rotate-45"
				>
					<path d="M1 1L13 13M1 13L13 1" stroke="black" stroke-width="1" />
				</svg>
			</button>
		</div>
	{/if}
</div>

<style lang="postcss">
	:global(.basestyles p) {
		@apply text-sm md:text-base font-martina;
	}

	:global(.basestyles.introtext p) {
		@apply md:text-[1.2rem];
	}

	:global(.basestyles.ar p) {
		@apply text-ar-sm md:text-ar-base font-lyon text-right;
	}

	:global(.basestyles.ar.introtext p) {
		@apply md:text-[1.3rem];
	}
</style>
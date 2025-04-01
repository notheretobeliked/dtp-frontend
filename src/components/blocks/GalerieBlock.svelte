<script lang="ts">
  const images = block.galerie.galerie.nodes
  import Carousel from '$components/Carousel.svelte';
  interface Props {
    block: EditorBlock;
  }

  let { block }: Props = $props();
</script>

<Carousel autoplay={true} images={images} />


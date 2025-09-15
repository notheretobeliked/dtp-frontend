<script lang="ts">
  interface Props {
    aspectRatio?: number;
    className?: string;
  }
  
  let { aspectRatio = 1, className = '' }: Props = $props();
</script>

<div 
  class="animate-pulse bg-gray-200 {className}"
  style="aspect-ratio: {aspectRatio};"
>
  <div class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
</div>
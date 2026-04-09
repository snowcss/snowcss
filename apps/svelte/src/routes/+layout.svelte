<script lang="ts">
import 'virtual:snowcss.css'

import favicon from '$lib/assets/favicon.svg'

const { children } = $props()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<script lang="ts">
import { value } from 'snowcss/client'

const blue = value('color.blue.500')
</script>

<main class="container">
  <h1 class="heading">Astro</h1>
  <p class="value">color.blue.500 = {blue}</p>
</main>

<style>
  .container {
    padding: --token("size.4");
  }

  .heading {
    font-family: --token("font.sans");
  }
</style>

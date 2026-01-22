<script setup lang="ts">
  import { value } from 'snowcss/client'

  import Divider from './Divider.vue'
  import Info from './Info.vue'

  const colors = value('color')

  const palettes = Object.entries(colors).map(([name, variants]) => ({
    name: capitalize(name),
    shades: Object.entries(variants).map(([name, color]) => ({
      name,
      color,
    })),
  }))

  const columns = Object.keys(colors.gray).length

  function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
</script>

<template>
  <Info>
    <p>This page demonstrates usage of:</p>

    <ul>
      <li>
        Runtime access to defined tokens via <code>value()</code> with full autocomplete
      </li>

      <li>
        <code>--token()</code> CSS function for CSS variable references
      </li>

      <li>
        <code>--value()</code> CSS function for inlining values in <code>@media</code> queries
      </li>
    </ul>
  </Info>

  <Divider />

  <div :class="$style.palettes">
    <div
      v-for="palette in palettes"
      :key="palette.name"
      :class="$style.palette"
    >
      <h3 :class="$style.paletteName">{{ palette.name }}</h3>

      <div
        :style="{ '--columns': columns }"
        :class="$style.swatches"
      >
        <div
          v-for="shade in palette.shades"
          :key="shade.name"
          :style="{ '--shade-color': shade.color }"
          :class="$style.swatch"
        >
          <span :class="$style.shadeLabel">{{ shade.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style module>
.palettes {
  display: flex;
  flex-direction: column;
  gap: --token('size.4');
  padding: --token('size.4');
}

.palette {
  display: flex;
  flex-direction: column;
  gap: --token('size.2');
}

.paletteName {
  font-size: 1.25rem;
  font-weight: 600;
  color: --token('color.gray.200');
  text-transform: capitalize;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: --token('size.2');
}

.swatch {
  aspect-ratio: 1;
  border-radius: --token('radius.md');
  display: flex;
  align-items: flex-end;
  padding: --token('size.1');
  background-color: var(--shade-color);
}

.shadeLabel {
  font-size: 0.75rem;
  font-weight: 600;
  padding-inline: --token('size.1.5');
  color: --token('color.gray.900');
  background: --token('color.gray.100');
  border-radius: --token('radius.sm');
}

@media (min-width: --value('breakpoint.sm')) {
  .swatches {
    grid-template-columns: repeat(var(--columns), 1fr);
  }
}
</style>

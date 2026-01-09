<script setup lang="ts">
  import Divider from './Divider.vue'
  import Info from './Info.vue'

  const colors = ['gray','blue','green','red','amber']
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

  const palettes = colors.map(name => ({
    name,
    shades,
  }))
</script>

<template>
  <Info>
    <p>Color palettes demonstrating <code>--token()</code> for CSS variable references.</p>
    <p>Each swatch uses <code>background: --token("color.palette.shade")</code>.</p>
    <p>Use <code>--value("color.blue.500" / 50%)</code> for alpha transparency.</p>
  </Info>

  <Divider />

  <div class="palettes">
    <div
      v-for="palette in palettes"
      :key="palette.name"
      class="palette"
    >
      <h3 class="palette-name">{{ palette.name }}</h3>
      <div class="swatches">
        <div
          v-for="shade in palette.shades"
          :key="shade"
          class="swatch"
          :data-palette="palette.name"
          :data-shade="shade"
        >
          <span class="shade-label">{{ shade }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.palette-name {
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
  padding: --token('size.2');
}

.swatch[data-palette='gray'][data-shade='50'] {
  background: --token('color.gray.50');
}
.swatch[data-palette='gray'][data-shade='100'] {
  background: --token('color.gray.100');
}
.swatch[data-palette='gray'][data-shade='200'] {
  background: --token('color.gray.200');
}
.swatch[data-palette='gray'][data-shade='300'] {
  background: --token('color.gray.300');
}
.swatch[data-palette='gray'][data-shade='400'] {
  background: --token('color.gray.400');
}
.swatch[data-palette='gray'][data-shade='500'] {
  background: --token('color.gray.500');
}
.swatch[data-palette='gray'][data-shade='600'] {
  background: --token('color.gray.600');
}
.swatch[data-palette='gray'][data-shade='700'] {
  background: --token('color.gray.700');
}
.swatch[data-palette='gray'][data-shade='800'] {
  background: --token('color.gray.800');
}
.swatch[data-palette='gray'][data-shade='900'] {
  background: --token('color.gray.900');
}
.swatch[data-palette='gray'][data-shade='950'] {
  background: --token('color.gray.950');
}

.swatch[data-palette='blue'][data-shade='50'] {
  background: --token('color.blue.50');
}
.swatch[data-palette='blue'][data-shade='100'] {
  background: --token('color.blue.100');
}
.swatch[data-palette='blue'][data-shade='200'] {
  background: --token('color.blue.200');
}
.swatch[data-palette='blue'][data-shade='300'] {
  background: --token('color.blue.300');
}
.swatch[data-palette='blue'][data-shade='400'] {
  background: --token('color.blue.400');
}
.swatch[data-palette='blue'][data-shade='500'] {
  background: --token('color.blue.500');
}
.swatch[data-palette='blue'][data-shade='600'] {
  background: --token('color.blue.600');
}
.swatch[data-palette='blue'][data-shade='700'] {
  background: --token('color.blue.700');
}
.swatch[data-palette='blue'][data-shade='800'] {
  background: --token('color.blue.800');
}
.swatch[data-palette='blue'][data-shade='900'] {
  background: --token('color.blue.900');
}
.swatch[data-palette='blue'][data-shade='950'] {
  background: --token('color.blue.950');
}

.swatch[data-palette='green'][data-shade='50'] {
  background: --token('color.green.50');
}
.swatch[data-palette='green'][data-shade='100'] {
  background: --token('color.green.100');
}
.swatch[data-palette='green'][data-shade='200'] {
  background: --token('color.green.200');
}
.swatch[data-palette='green'][data-shade='300'] {
  background: --token('color.green.300');
}
.swatch[data-palette='green'][data-shade='400'] {
  background: --token('color.green.400');
}
.swatch[data-palette='green'][data-shade='500'] {
  background: --token('color.green.500');
}
.swatch[data-palette='green'][data-shade='600'] {
  background: --token('color.green.600');
}
.swatch[data-palette='green'][data-shade='700'] {
  background: --token('color.green.700');
}
.swatch[data-palette='green'][data-shade='800'] {
  background: --token('color.green.800');
}
.swatch[data-palette='green'][data-shade='900'] {
  background: --token('color.green.900');
}
.swatch[data-palette='green'][data-shade='950'] {
  background: --token('color.green.950');
}

.swatch[data-palette='red'][data-shade='50'] {
  background: --token('color.red.50');
}
.swatch[data-palette='red'][data-shade='100'] {
  background: --token('color.red.100');
}
.swatch[data-palette='red'][data-shade='200'] {
  background: --token('color.red.200');
}
.swatch[data-palette='red'][data-shade='300'] {
  background: --token('color.red.300');
}
.swatch[data-palette='red'][data-shade='400'] {
  background: --token('color.red.400');
}
.swatch[data-palette='red'][data-shade='500'] {
  background: --token('color.red.500');
}
.swatch[data-palette='red'][data-shade='600'] {
  background: --token('color.red.600');
}
.swatch[data-palette='red'][data-shade='700'] {
  background: --token('color.red.700');
}
.swatch[data-palette='red'][data-shade='800'] {
  background: --token('color.red.800');
}
.swatch[data-palette='red'][data-shade='900'] {
  background: --token('color.red.900');
}
.swatch[data-palette='red'][data-shade='950'] {
  background: --token('color.red.950');
}

.swatch[data-palette='amber'][data-shade='50'] {
  background: --token('color.amber.50');
}
.swatch[data-palette='amber'][data-shade='100'] {
  background: --token('color.amber.100');
}
.swatch[data-palette='amber'][data-shade='200'] {
  background: --token('color.amber.200');
}
.swatch[data-palette='amber'][data-shade='300'] {
  background: --token('color.amber.300');
}
.swatch[data-palette='amber'][data-shade='400'] {
  background: --token('color.amber.400');
}
.swatch[data-palette='amber'][data-shade='500'] {
  background: --token('color.amber.500');
}
.swatch[data-palette='amber'][data-shade='600'] {
  background: --token('color.amber.600');
}
.swatch[data-palette='amber'][data-shade='700'] {
  background: --token('color.amber.700');
}
.swatch[data-palette='amber'][data-shade='800'] {
  background: --token('color.amber.800');
}
.swatch[data-palette='amber'][data-shade='900'] {
  background: --token('color.amber.900');
}
.swatch[data-palette='amber'][data-shade='950'] {
  background: --token('color.amber.950');
}

.shade-label {
  font-size: 0.75rem;
  font-weight: 600;
  padding-inline: --token('size.1.5');
  color: --token('color.gray.900');
  background: --token('color.gray.100');
  border-radius: --token('radius.sm');
}

@media (min-width: --value('breakpoint.sm')) {
  .swatches {
    grid-template-columns: repeat(11, 1fr);
  }
}
</style>

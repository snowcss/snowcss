<script setup lang="ts">
  import { value } from 'snowcss/client'

  import Info from './Info.vue'

  const sizes = Object.entries(value('size')).sort(([,a], [,b]) => {
    const numericA = parseSize(a)
    const numericB = parseSize(b)

    return numericA - numericB
  }).map(([name, value]) => ({
    name,
    value
  }))

  function parseSize(size: string): number {
    return size.includes('px') ? parseFloat(size) / 16 : parseFloat(size)
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
        Spacing scale using <code>--token()</code> for dynamic references and
        <code>--value()</code> for static values.
      </li>

      <li>
        Unit conversion example: <code>--value("size.64" to px)</code> outputs 256px.
      </li>
    </ul>
  </Info>

  <Divider />

  <div :class="$style.sizes">
    <div
      v-for="size in sizes"
      :key="size.name"
      :class="$style.sizeItem"
    >
      <div :class="$style.sizeLabel">
        <code>size.{{ size.name }}</code>
        <span :class="$style.sizeValue">{{ size.value }}</span>
      </div>

      <div
        :style="{ '--size-value': size.value }"
        :class="$style.sizeBar"
      />
    </div>
  </div>
</template>

<style module>
.sizes {
  display: flex;
  flex-direction: column;
  gap: --token('size.4');
  padding: --token('size.4');
}

.sizeItem {
  display: flex;
  align-items: center;
  gap: --token('size.4');
}

.sizeLabel {
  min-width: 180px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sizeLabel code {
  font-family: --token('font.mono');
  font-weight: 600;
  color: --token('color.gray.100');
}

.sizeValue {
  font-size: 0.875rem;
  color: --token('color.gray.400');
}

.sizeBar {
  width: var(--size-value);
  height: --token('size.8');
  background: --token('color.blue.500');
  border-radius: --token('radius.sm');
}
</style>

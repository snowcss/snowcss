<script setup lang="ts">
  import Info from './Info.vue'

  const sizes = [
    { key: '0', value: '0px' },
    { key: 'px', value: '1px' },
    { key: '0.5', value: '0.125rem' },
    { key: '1', value: '0.25rem' },
    { key: '2', value: '0.5rem' },
    { key: '3', value: '0.75rem' },
    { key: '4', value: '1rem' },
    { key: '6', value: '1.5rem' },
    { key: '8', value: '2rem' },
    { key: '10', value: '2.5rem' },
    { key: '12', value: '3rem' },
    { key: '16', value: '4rem' },
    { key: '20', value: '5rem' },
    { key: '24', value: '6rem' },
  ]
</script>

<template>
  <Info>
    <p>
      Spacing scale using <code>--token()</code> for dynamic references and
      <code>--value()</code> for static values.
    </p>

    <p>Unit conversion example: <code>--value("size.64" to px)</code> outputs 256px.</p>
  </Info>

  <Divider />

  <div class="sizes">
    <div
      v-for="size in sizes"
      :key="size.key"
      class="size-item"
    >
      <div class="size-label">
        <code>size.{{ size.key }}</code>
        <span class="size-value">{{ size.value }}</span>
      </div>

      <div class="size-bar" :data-size="size.key" />
    </div>
  </div>
</template>

<style scoped>
.sizes {
  display: flex;
  flex-direction: column;
  gap: --token('size.4');
  padding: --token('size.4');
}

.size-item {
  display: flex;
  align-items: center;
  gap: --token('size.4');
}

.size-label {
  min-width: 180px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.size-label code {
  font-family: --token('font.mono');
  font-weight: 600;
  color: --token('color.gray.100');
}

.size-value {
  font-size: 0.875rem;
  color: --token('color.gray.400');
}

.size-bar {
  height: --token('size.8');
  background: --token('color.blue.500');
  border-radius: --token('radius.sm');
}

.size-bar[data-size='px'] {
  width: --token('size.px');
}
.size-bar[data-size='0'] {
  width: --token('size.0');
}
.size-bar[data-size='0.5'] {
  width: --token('size.0.5');
}
.size-bar[data-size='1'] {
  width: --token('size.1');
}
.size-bar[data-size='2'] {
  width: --token('size.2');
}
.size-bar[data-size='3'] {
  width: --token('size.3');
}
.size-bar[data-size='4'] {
  width: --token('size.4');
}
.size-bar[data-size='6'] {
  width: --token('size.6');
}
.size-bar[data-size='8'] {
  width: --token('size.8');
}
.size-bar[data-size='10'] {
  width: --token('size.10');
}
.size-bar[data-size='12'] {
  width: --token('size.12');
}
.size-bar[data-size='16'] {
  width: --token('size.16');
}
.size-bar[data-size='20'] {
  width: --token('size.20');
}
.size-bar[data-size='24'] {
  width: --token('size.24');
}
</style>

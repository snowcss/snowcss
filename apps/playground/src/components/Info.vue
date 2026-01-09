<template>
  <div class="info">
    <slot />
  </div>
</template>

<style scoped>
.info {
  padding: --token('size.4');
  background: --token('color.gray.800');
}

.info :deep(p) {
  color: --token('color.gray.100');
}

.info :deep(code) {
  padding: --token('size.0.5') --token('size.1');
  border-radius: --token('radius.sm');
  font-family: --token('font.mono');
  font-weight: 600;
  font-size: 0.9em;
  color: --token('color.blue.400');
}
</style>

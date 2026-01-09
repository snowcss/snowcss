<script setup lang="ts">
  import { ref } from 'vue'

  import Colors from './components/Colors.vue'
  import Sizes from './components/Sizes.vue'
  import Cards from './components/Cards.vue'
  import Divider from './components/Divider.vue'

  const tabs = ['colors', 'sizes', 'cards'] as const
  const activeTab = ref<typeof tabs[number]>('colors')
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>@snowcss playground</h1>

      <ul class="links">
        <li
          v-for="tab in tabs"
          :key="tab"
        >
          <div
            :class="['links-item', activeTab == tab && 'links-item-active']"
            @click="activeTab = tab"
          >
            {{ tab }}
          </div>
        </li>
      </ul>
    </header>

    <Divider />

    <main class="content">
      <Colors v-if="activeTab === 'colors'" />
      <Sizes v-if="activeTab === 'sizes'" />
      <Cards v-if="activeTab === 'cards'" />
    </main>
  </div>

</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: --value('breakpoint.lg');
  margin: 0 auto;
  border-inline: 1px solid --token('color.gray.700');
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: --token('size.4');
}

.header > * {
  font-size: 1.25rem;
  font-weight: 700;
  color: --token('color.gray.100');
}

.links {
  display: flex;
  align-items: center;
  gap: --token('size.4');
  list-style: none;
}

.links-item {
  background: transparent;
  border: none;
  color: --token('color.gray.300');
  font-size: 1rem;
  cursor: pointer;
}

.links-item:not(.links-item-active):hover {
  color: --token('color.blue.200');
}

.links-item-active {
  color: --token('color.blue.400');
}

.content {
  height: 100%;
  width: 100%;
}
</style>

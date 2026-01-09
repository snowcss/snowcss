<script setup lang="ts">
  import Divider from './Divider.vue';
  import Info from './Info.vue'
</script>

<template>
  <Info>
    <p>Card components styled entirely with Snow CSS tokens.</p>
  </Info>

  <Divider />

  <div class="cards-grid">
    <div class="card card-basic">
      <h3>Basic Card</h3>
      <p>
        Uses <code>--token()</code> for padding, border radius, background, and border colors.
      </p>
      <pre class="code-snippet">padding: --token("size.6");
border-radius: --token("radius.lg");
background: --token("color.gray.50");</pre>
    </div>

    <div class="card card-colored">
      <h3>Colored Outline</h3>
      <p>Demonstrates color tokens with a blue accent outline.</p>
      <pre class="code-snippet">outline-color: --token("color.blue.500");
color: --token("color.gray.900");</pre>
    </div>

    <div class="card card-hover">
      <h3>Interactive Card</h3>
      <p>Hover to see state changes using different token shades.</p>
      <pre class="code-snippet">background: --token("color.gray.50");
&:hover {
  background: --token("color.blue.50");
}</pre>
    </div>

    <div class="card">
      <h3>Another Card</h3>
      <p>Just a card with some silly text.</p>
    </div>
  </div>
</template>

<style scoped>
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: --token('size.4');
  padding: --token('size.4');
}

.card {
  padding: --token('size.4');
  background: --token('color.gray.800');
  border: 1px solid --token('color.gray.700');
  border-radius: --token('radius.md');
  box-shadow: 0 1px --value('color.gray.950' / 50%);
}

.card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: --token('size.3');
  color: --token('color.gray.100');
}

.card p {
  margin-bottom: --token('size.4');
  color: --token('color.gray.300');
  font-size: 0.95rem;
  line-height: 1.5;
}

.card code {
  padding: --token('size.0.5') --token('size.1');
  border-radius: --token('radius.sm');
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 0.9em;
  color: --token('color.blue.400');
}

.code-snippet {
  padding: --token('size.4');
  background: --token('color.gray.900');
  color: --token('color.green.400');
  border-radius: --token('radius.md');
  font-family: --token('font.mono');
  font-size: 0.8rem;
  line-height: --token('leading.normal');
  overflow-x: auto;
}

.card-basic {
  background: --token('color.gray.800');
}

.card-colored {
  outline: 1px solid --token('color.blue.500');
}

.card-hover {
  background: --token('color.gray.800');
  transition: all 200ms ease-out;
  cursor: pointer;
}

.card-hover:hover {
  background: --value('color.gray.800' / 90%);
  border-color: --token('color.blue.500');
  transform: translateY(-0.125rem);
  box-shadow: 0 0.5rem 0 --value('color.blue.500' / 20%);
}

@media (min-width: --value('breakpoint.lg')) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

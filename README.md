# Snow CSS

> Cool by design.

A toolchain for building consistent, shareable, typesafe, and flexible design token systems.

## Configuration

Snow CSS supports the following config files:

- `snow.config.ts`
- `snow.config.js`
- `snow.config.mjs`

## Defining design tokens

Snow CSS provides a simple and type-safe way to define design tokens. The following defines a simple configuration for a design system with `color` and `size` token namespaces, which then can be referenced in your CSS using the custom `--value()` and `--token()` CSS functions.

```typescript
import { defineConfig } from '@snowcss/internal'

export default defineConfig({
  tokens: {
    color: {
      gray: {
        300: '#ddd',
        400: '#aaa',
        500: '#888',
      },
    },
    size: {
      4: '1rem',
      6: '1.5rem',
      8: '2rem',
      12: '3rem',
    },
  },
})
```

### Sharing design tokens

To share and reuse you design tokens, you can create a TypeScript library `@acme/design`, define your design tokens using the `defineTokens` helper and export them:

```typescript
import { defineTokens } from '@snowcss/internal'

export const color = defineTokens({
  gray: {
    300: '#ddd',
    400: '#aaa',
    500: '#888',
  },
})

export const size = defineTokens({
  4: '1rem',
  6: '1.5rem',
  8: '2rem',
  12: '3rem',
})
```

Now, to be able to use these tokens in your app or library styles, you need to import them in your `snow.config.ts`:

```typescript
import { defineConfig } from '@snowcss/internal'
import { color, size } from '@acme/design'

export default defineConfig({
  tokens: {
    color: color(),
    size: size(),
  },
})
```

After that you will be able to use `color` and `size` tokens in your CSS like so:

```css
.container {
  padding: --token('size.4');
  background: --token('color.gray.300');
}
```

### Extending and remapping tokens

But what if we want to override, rename, or extend `color` or `size` token values? Luckily, `defineTokens` returns not just a function, but a function object with `map` and `extend` methods attached to it, e.g.:

```typescript
const tokens = defineTokens({
  token1: 'value1',
  token2: 'value2',
})

tokens.map(it => ...)
tokens.extend({ ... })
```

> [!NOTE]
> Both `map` and `extend` return an object with mapped or extended tokens, not another function.

#### Extending and overriding tokens

You can use the `extend` method to extend existing namespaces or override token values.

In the example below, we extend the `color` tokens with a new ones (`gray.600` and `gray.700`) and override the `gray.500` value to be `#818181`, plus we add a new `blue` namespace:

```typescript
import { defineConfig } from '@snowcss/internal'
import { color, size } from '@acme/design'

export default defineConfig({
  tokens: {
    color: color.extend({
      gray: {
        500: '#818181',
        600: '#666',
        700: '#555',
      },
      blue: {
        500: '#00f',
      },
    }),
    size: size(),
  },
})
```

#### Remapping tokens

You can completely change the structure of the token namespace by using the `map` method.

In the rather contrived example below, we remap the `size` namespace so that the original tokens go in the `deprecated` namespace, and extend it with the `current` namespace:

```typescript
import { defineConfig } from '@snowcss/internal'
import { color, size } from '@acme/design'

export default defineConfig({
  tokens: {
    color: color(),
    size: size.map(it => ({
      deprecated: it,
      current: {
        base: '1rem',
        sm: '1.5rem',
        md: '2rem',
        lg: '3rem',
      },
    })),
  },
})
```

### Naming namespaces and tokens

It is best to use single-word names for your token namespaces, but you are free to use any valid CSS variable identifier. Examples of valid token namespace names:

- `color`, can be referenced as `--value('color.gray.300')`
- `fontSize`, can be referenced as `--value('fontSize.md')`
- `font-size`, can be referenced as `--value('font-size.md')`
- `foo13`, can be referenced as `--value('foo13.something')`

The root namespaces are not allowed to start with a number though, because will lead to producing invalid CSS variable names.

## Referencing design tokens

Snow CSS provides two custom CSS functions: `--value()` and `--token()`. While both can be used to access the design token's value, they do have different purposes.

### `--value()`

The `value` function allows to _inline_ the design token's value, optionally applying simple transformation to it, e.g. converting a `rem` value to `px`, or vice versa; converting color value from one color space to another; and so on.

```css
.container {
  /* Inlines the value of the `size.4` design token as is */
  padding: --value('size.4');

  /* Inlines the value of the `size.4` design token, converted to `px` or `rem` */
  padding: --value('size.4' to px);
  padding: --value('size.4' to rem);

  /* Inlines the value of the `color.gray.300` design token, with a 50% alpha channel */
  background: --value('color.gray.300' / 50%);

  /* Can also be used to inline breakpoint value, since var() is not suppored in media queries */
  @media (min-width: --value('breakpoints.sm')) {
    & {
      padding: --value('size.8');
      background: --value('color.gray.400');
    }
  }
}
```

### `--token()`

The `--token()` function allows you to only _reference_ the design token's value via the generated CSS variable.

```css
.container {
  /* Will be replaced with `var(--size-4)` */
  padding: --token('size.4');

  /* Will be replaced with `var(--color-gray-300)` */
  background: --token('color.gray.300');
}
```

## Injection options

Snow CSS supports the following options for injecting or emitting generated CSS variables:

- `at-rule`: The default option, find and replace `@snowcss` at-rule in CSS assets.
- `asset`: Emit as CSS asset, which will be referenced in the `index.html`[^1] file.
- `inline`: Injected into the `index.html`[^1] as inline `<style>` tag.

You can specify where to inject the generated CSS variables via the `inject` option in `snow.config.ts`:

```ts
import { defineConfig } from '@snowcss/internal'

export default defineConfig({
  prefix: 'app',
  inject: 'asset',
  tokens: {},
})
```

[^1]: `index.html` is the default entrypoint for Vite.

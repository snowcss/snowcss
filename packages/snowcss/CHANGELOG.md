# snowcss

## 0.3.0

### Minor Changes

- [#23](https://github.com/snowcss/snowcss/pull/23) [`72be759`](https://github.com/snowcss/snowcss/commit/72be7598004b77a7f732777c25b004e0ea821e45) Thanks [@norskeld](https://github.com/norskeld)! - Add support for SSR/SSG apps using new `snowcss/tokens.css` export

  `snowcss/client` runtime functions (`token`, `value`, `tokens`) now work in server and prerender bundles as well as the browser, since the import resolves to an internal virtual module that Vite does not externalize

### Patch Changes

- [#23](https://github.com/snowcss/snowcss/pull/23) [`72be759`](https://github.com/snowcss/snowcss/commit/72be7598004b77a7f732777c25b004e0ea821e45) Thanks [@norskeld](https://github.com/norskeld)! - Properly re-export types needed for `defineTokens`

- Updated dependencies [[`72be759`](https://github.com/snowcss/snowcss/commit/72be7598004b77a7f732777c25b004e0ea821e45), [`72be759`](https://github.com/snowcss/snowcss/commit/72be7598004b77a7f732777c25b004e0ea821e45)]:
  - @snowcss/vite@0.4.0
  - @snowcss/internal@0.1.3

## 0.2.0

### Minor Changes

- [#15](https://github.com/snowcss/snowcss/pull/15) [`532390d`](https://github.com/snowcss/snowcss/commit/532390d6e0fa03957c8068ecb5481c290b3c60e3) Thanks [@norskeld](https://github.com/norskeld)! - Add user-facing package exposing config-related helpers, runtime types and runtime stubs

### Patch Changes

- Updated dependencies [[`532390d`](https://github.com/snowcss/snowcss/commit/532390d6e0fa03957c8068ecb5481c290b3c60e3)]:
  - @snowcss/vite@0.3.0
  - @snowcss/internal@0.1.1

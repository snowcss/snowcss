# @snowcss/core

## 0.2.0

### Minor Changes

- [#11](https://github.com/snowcss/snowcss/pull/11) [`86fce99`](https://github.com/snowcss/snowcss/commit/86fce99867b13fbc27153584a38a9bef038ebbc0) Thanks [@norskeld](https://github.com/norskeld)! - Refactor and improve the core primitives

  - Refactored the token processing pipeline with new `--token()` and `--value()` CSS function syntax
  - Refactored extraction, resolution, and emitter modules
  - Improved `defineConfig` and `Config` with proper type inference of used tokens

---
"@snowcss/core": minor
"@snowcss/vite": minor
---

**@snowcss/core**: Refactored the token processing pipeline with new `--token()` and `--value()` CSS function syntax. Added extraction, resolution, and emit modules for parsing CSS, matching functions against config tokens, applying modifiers (alpha for colors, unit conversion for sizes), and generating CSS variable declarations. Improved `defineConfig` and `Config` implementation with comprehensive test coverage.

**@snowcss/vite**: New Vite plugin with three injection modes (`at-rule`, `asset`, `inline`). Dev mode serves all tokens for HMR; build mode optimizes to only include used tokens. Includes unit and integration tests.

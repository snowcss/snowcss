---
"@snowcss/core": minor
---

Refactored the token processing pipeline with new `--token()` and `--value()` CSS function syntax. Added extraction, resolution, and emit modules for parsing CSS, matching functions against config tokens, applying modifiers (alpha for colors, unit conversion and negation for sizes), and generating CSS variable declarations. Improved `defineConfig` and `Config` implementation with test coverage.

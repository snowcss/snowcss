---
"snowcss": minor
"@snowcss/vite": minor
---

Add support for SSR/SSG apps using new `snowcss/tokens.css` export

`snowcss/client` runtime functions (`token`, `value`, `tokens`) now work in server and prerender bundles as well as the browser, since the import resolves to an internal virtual module that Vite does not externalize

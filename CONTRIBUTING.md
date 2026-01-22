# Contributing

## Setup

```bash
# Clone the repository
git clone https://github.com/snowcss/snowcss.git
cd snowcss

# Install dependencies (requires pnpm 10+)
pnpm install
```

## Development

```bash
# Build all packages
pnpm -r build

# Build specific package
pnpm --filter @snowcss/internal build

# Build in watch mode
pnpm --filter @snowcss/internal build:watch

# Run tests
pnpm --filter @snowcss/internal test

# Run tests in watch mode
pnpm --filter @snowcss/internal test:watch
```

## Code Style

Biome handles formatting and linting. It runs automatically on pre-commit via lefthook, but you can run it manually:

```bash
pnpm check:fix
```

## Pull Requests

### Commits

We use squash merge strategy, so you are free to use any commit message format in the PR, but it is still encouraged to make atomic commits with short and meaningful messages.

### PR Titles

PR titles must follow the following format:

```
<scope>: <description>
```

- **scope**: `internal`, `vite`, `lsp`, `vscode`, or `*` for changes that do not affect packages
- **description**: short description of the change

> [!NOTE]
> If changes affect multiple packages, mention them all in the scope (e.g., `internal, vite, lsp: add support for oklch colors`).

Examples:

- `internal: add support for oklch colors`
- `vite: resolve hot reload issue`
- `*: update CI workflows`

### Changesets

For changes that affect published packages, a changeset is required:

```bash
pnpm changeset
```

This will prompt you to select affected packages and describe the change. Changesets are used to generate changelogs and determine version bumps.

Skip changesets for changes that don't affect package consumers (CI, docs, internal refactors).

If you are not sure if your changes require a changeset, just skip adding it, maintainers will add it if necessary.
